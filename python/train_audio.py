from datasets import load_dataset
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainingArguments, 
    Seq2SeqTrainer
)
import torch
import torchaudio

# Load dataset
dataset = load_dataset("json", data_files="bugis_dataset.json")["train"]

# Load model and processor
model_name = "openai/whisper-small"
model = WhisperForConditionalGeneration.from_pretrained(model_name)
processor = WhisperProcessor.from_pretrained(model_name)

def preprocess_data(batch):
    """
    Preprocess each data sample by loading audio, resampling to 16kHz,
    converting to mono if necessary, extracting features, and tokenizing text.
    """
    audio_path = batch["audio"]
    audio_tensor, sample_rate = torchaudio.load(audio_path)
    
    # Resample audio to 16kHz
    resampler = torchaudio.transforms.Resample(sample_rate, 16000)
    audio_tensor = resampler(audio_tensor)
    
    # Convert stereo to mono if needed
    if audio_tensor.shape[0] > 1:
        audio_tensor = torch.mean(audio_tensor, dim=0, keepdim=True)
    
    # Remove extra dimension if mono
    audio_tensor = audio_tensor.squeeze(0)
    
    # Extract mel spectrogram features
    mel_features = processor(audio_tensor, sampling_rate=16000, return_tensors="pt").input_features
    batch["input_features"] = mel_features.squeeze(0)
    
    # Tokenize text labels
    batch["labels"] = processor.tokenizer(
        batch["text"], padding="max_length", truncation=True, max_length=448
    ).input_ids
    
    return batch

# Apply preprocessing to dataset
dataset = dataset.map(preprocess_data)

# Split dataset into train and validation sets
dataset = dataset.train_test_split(test_size=0.2)

# Define training arguments with evaluation enabled
training_args = Seq2SeqTrainingArguments(
    output_dir="./whisper-bugis",
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    gradient_accumulation_steps=2,
    learning_rate=5e-5,
    warmup_steps=500,
    num_train_epochs=3,
    logging_dir="./logs",
    logging_steps=10,
    save_strategy="epoch",
    evaluation_strategy="epoch",  # Enable evaluation per epoch
    eval_steps=500,  # Evaluate every 500 steps
    save_total_limit=2,  # Keep only the last 2 models
    load_best_model_at_end=True,  # Load best model after training
    metric_for_best_model="loss"  # Use validation loss to determine best model
)

# Define Trainer
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],  # Use validation dataset
    tokenizer=processor.feature_extractor,  # Ensure proper tokenization
)

# Train model
trainer.train()

# Save model and processor
model.save_pretrained("./whisper-small-bugis")
processor.save_pretrained("./whisper-small-bugis")
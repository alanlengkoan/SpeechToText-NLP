
from transformers import WhisperFeatureExtractor, WhisperTokenizer, WhisperProcessor, WhisperForConditionalGeneration
from transformers import Seq2SeqTrainingArguments, Seq2SeqTrainer
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
import torchaudio

model = WhisperForConditionalGeneration.from_pretrained("./whisper-small-bugis")
processor = WhisperProcessor.from_pretrained("./whisper-small-bugis")

t5_model = T5ForConditionalGeneration.from_pretrained("./t5-bugis-indo")
t5_tokenizer = T5Tokenizer.from_pretrained("./t5-bugis-indo")

def transcribe_audio(audio_path):
    # Load audio
    audio_tensor, sample_rate = torchaudio.load(audio_path)

    # Convert stereo to mono if needed
    if audio_tensor.shape[0] > 1:
        audio_tensor = torch.mean(audio_tensor, dim=0, keepdim=True)

    # Resample to 16 kHz if needed
    if sample_rate != 16000:
        transform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
        audio_tensor = transform(audio_tensor)

    # Flatten to match expected input shape
    audio_tensor = audio_tensor.squeeze(0)

    # Process input
    input_features = processor(audio_tensor.numpy(), sampling_rate=16000, return_tensors="pt").input_features

    # Gunakan Whisper untuk transkripsi
    with torch.no_grad():
        predicted_ids = model.generate(input_features)

    # Decode hasil transkripsi
    transcription = processor.decode(predicted_ids[0], skip_special_tokens=True)
    return transcription

# Contoh penggunaan
audio_file = "2.wav"
bugis_text = transcribe_audio(audio_file)
print(f"Transkripsi Bugis: {bugis_text}")
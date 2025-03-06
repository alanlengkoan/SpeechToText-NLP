from datasets import load_dataset
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    TrainingArguments,
    Trainer
)
import torch
import numpy as np

# 🟢 Load dataset dari JSON
dataset = load_dataset("json", data_files="translate_dataset.json")["train"]

# 🔹 Bagi dataset menjadi train dan test
dataset_split = dataset.train_test_split(test_size=0.2)
train_dataset = dataset_split["train"]
eval_dataset = dataset_split["test"]

# ✅ Load tokenizer & model
model_name = "t5-base"  # Bisa diganti dengan "mt5-small" atau "mt5-base"
tokenizer = T5Tokenizer.from_pretrained(model_name)

# 🔹 Fungsi preprocessing untuk tokenisasi dataset
def preprocess_function(examples):
    model_inputs = tokenizer(
        examples["source"], padding="max_length", truncation=True, max_length=128
    )
    labels = tokenizer(
        examples["target"], padding="max_length", truncation=True, max_length=128
    )

    model_inputs["labels"] = [
        [(label if label != tokenizer.pad_token_id else -100) for label in lbls] 
        for lbls in labels["input_ids"]
    ]
    return model_inputs

# ✅ Tokenisasi dataset
tokenized_train = train_dataset.map(preprocess_function, batched=True)
tokenized_eval = eval_dataset.map(preprocess_function, batched=True)

# 🟢 Load model
model = T5ForConditionalGeneration.from_pretrained(model_name)

# 🟢 Training Arguments
training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="steps",
    save_strategy="steps",
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    num_train_epochs=10,
    logging_dir="./logs",
    logging_steps=10,
    save_steps=1000,
    save_total_limit=2,
    warmup_steps=500,
    weight_decay=0.01,
    logging_first_step=True,
    fp16=True,
    load_best_model_at_end=True,
    metric_for_best_model="loss",
)

# 🟢 Inisialisasi Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_eval,
    tokenizer=tokenizer
)

# 🔥 Mulai training
trainer.train()

# ✅ Simpan model yang sudah di-train
model.save_pretrained("./t5-bugis-indo")
tokenizer.save_pretrained("./t5-bugis-indo")
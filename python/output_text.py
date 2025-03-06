from transformers import T5ForConditionalGeneration, T5Tokenizer

# Load model terjemahan Bugis → Indonesia
t5_model_path = "./t5-bugis-indo"
t5_model = T5ForConditionalGeneration.from_pretrained(t5_model_path)
t5_tokenizer = T5Tokenizer.from_pretrained(t5_model_path)

# Fungsi untuk menerjemahkan teks menggunakan model yang sudah dilatih
def translate_text(text):
    inputs = t5_tokenizer(text, padding="max_length", truncation=True, max_length=128, return_tensors="pt")

    with torch.no_grad():
        outputs = t5_model.generate(**inputs, max_length=50)
    
    return t5_tokenizer.decode(outputs[0], skip_special_tokens=True)

# Contoh penerjemahan
text = "palluaki senterennu"
translation = translate_text(text)
print(translation)

import datasets
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Embedding
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle  # Untuk menyimpan tokenizer

# Load data dari Hugging Face Datasets
dataset = datasets.load_dataset("json", data_files="dataset_bahasa_bugis.json")
data = dataset["train"]

bugis_texts = [item["source"] for item in data]
indo_texts = [item["target"] for item in data]

# Tokenisasi data
bugis_tokenizer = Tokenizer()
bugis_tokenizer.fit_on_texts(bugis_texts)
indo_tokenizer = Tokenizer()
indo_tokenizer.fit_on_texts(indo_texts)

bugis_sequences = bugis_tokenizer.texts_to_sequences(bugis_texts)
indo_sequences = indo_tokenizer.texts_to_sequences(indo_texts)

# Tambahkan token <start> dan <end> pada target sequences
indo_sequences = [[1] + seq + [2] for seq in indo_sequences]  # 1 = <start>, 2 = <end>

# Padding sequences
max_len = max(max(map(len, bugis_sequences)), max(map(len, indo_sequences)))
bugis_sequences = pad_sequences(bugis_sequences, maxlen=max_len, padding='post')
indo_sequences = pad_sequences(indo_sequences, maxlen=max_len, padding='post')

# Parameter model
latent_dim = 256
vocab_size_bugis = len(bugis_tokenizer.word_index) + 1
vocab_size_indo = len(indo_tokenizer.word_index) + 3  # +3 untuk token khusus

# Encoder
encoder_inputs = Input(shape=(max_len,))
enc_emb = Embedding(vocab_size_bugis, latent_dim, mask_zero=True)(encoder_inputs)
encoder_lstm = LSTM(latent_dim, return_state=True)
encoder_outputs, state_h, state_c = encoder_lstm(enc_emb)
encoder_states = [state_h, state_c]

# Decoder
decoder_inputs = Input(shape=(max_len,))
dec_emb_layer = Embedding(vocab_size_indo, latent_dim, mask_zero=True)
dec_emb = dec_emb_layer(decoder_inputs)
decoder_lstm = LSTM(latent_dim, return_sequences=True, return_state=True)
decoder_outputs, _, _ = decoder_lstm(dec_emb, initial_state=encoder_states)
decoder_dense = Dense(vocab_size_indo, activation='softmax')
decoder_outputs = decoder_dense(decoder_outputs)

# Model pelatihan
model = Model([encoder_inputs, decoder_inputs], decoder_outputs)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')

# Siapkan target data
indo_sequences_output = np.zeros_like(indo_sequences)
indo_sequences_output[:, :-1] = indo_sequences[:, 1:]
indo_sequences_output[:, -1] = 2  # Token <end>

# Training model
history = model.fit(
    [bugis_sequences, indo_sequences], indo_sequences_output,
    batch_size=32, epochs=50, validation_split=0.2
)

# Simpan model dalam format Keras baru
model.save("translation_model.keras")

# Simpan tokenizer dan parameter
with open("bugis_tokenizer.pkl", "wb") as f:
    pickle.dump(bugis_tokenizer, f)

with open("indo_tokenizer.pkl", "wb") as f:
    pickle.dump(indo_tokenizer, f)

np.save("max_len.npy", max_len)

# Plot Train Loss vs Validation Loss
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('Train Loss vs Validation Loss')
plt.legend()
plt.show()

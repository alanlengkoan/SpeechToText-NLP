import datasets
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Embedding
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

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

# Menambahkan token <start> dan <end> ke target sequences
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

# Menyiapkan target data
indo_sequences_output = np.zeros_like(indo_sequences)
indo_sequences_output[:, :-1] = indo_sequences[:, 1:]
indo_sequences_output[:, -1] = 2  # Token <end>

# Training model
model.fit(
    [bugis_sequences, indo_sequences], indo_sequences_output,
    batch_size=32, epochs=50, validation_split=0.2
)

# Model Encoder untuk inferensi
encoder_model = Model(encoder_inputs, encoder_states)

# Model Decoder untuk inferensi
decoder_state_input_h = Input(shape=(latent_dim,))
decoder_state_input_c = Input(shape=(latent_dim,))
decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]

dec_emb_inf = dec_emb_layer(decoder_inputs)  # Gunakan embedding yang sama

decoder_outputs, state_h, state_c = decoder_lstm(dec_emb_inf, initial_state=decoder_states_inputs)
decoder_states = [state_h, state_c]
decoder_outputs = decoder_dense(decoder_outputs)

decoder_model = Model([decoder_inputs] + decoder_states_inputs, [decoder_outputs] + decoder_states)


def decode_sequence(input_text):
    input_seq = bugis_tokenizer.texts_to_sequences([input_text])
    input_seq = pad_sequences(input_seq, maxlen=max_len, padding='post')

    # Encode input
    states_value = encoder_model.predict(input_seq)

    # Inisialisasi input decoder dengan token <start>
    target_seq = np.zeros((1, 1))
    target_seq[0, 0] = indo_tokenizer.word_index.get('<start>', 1)  # Pastikan indeks token <start>

    stop_condition = False
    decoded_sentence = []

    for _ in range(max_len):
        output_tokens, h, c = decoder_model.predict([target_seq] + states_value)

        # Ambil token dengan probabilitas tertinggi
        sampled_token_index = np.argmax(output_tokens[0, -1, :])

        # Ambil kata dari indeks
        sampled_word = {index: word for word, index in indo_tokenizer.word_index.items()}.get(sampled_token_index)
        # Hentikan jika token <end> muncul
        if sampled_word is None or sampled_word == '<end>':
            break

        decoded_sentence.append(sampled_word)

        # Update target_seq untuk langkah selanjutnya
        target_seq = np.zeros((1, 1))
        target_seq[0, 0] = sampled_token_index

        # Perbarui state decoder
        states_value = [h, c]

    return ' '.join(decoded_sentence)


input_text = "pakessingiki batenu manre"
translated_text = decode_sequence(input_text)
print(f"Bugis: {input_text} -> Indonesia: {translated_text}")
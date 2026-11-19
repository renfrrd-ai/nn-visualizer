# Neural Networks, Visualized

An interactive web page that shows what different kinds of neural network layers actually compute, one number at a time.

No build step and no dependencies: open `index.html` in a browser, or serve the folder with any static server.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's inside

| Tab | What you can do |
| --- | --- |
| **Perceptron** | A single neuron with every part labelled: inputs, weights, bias, weighted sum, activation, output. Train it with the perceptron learning rule and watch the decision boundary move, see why XOR is impossible for one neuron, and how a hidden layer fixes it. Ends with a glossary of the terms used throughout. |
| **Dense network** | A 3–4–4–2 fully connected network. Move the inputs, animate the forward pass, switch activations (ReLU, tanh, sigmoid), and click any neuron to see `z = Σ w·a + b` with the real numbers. |
| **Convolution** | Watch a 3×3 kernel slide over a 10×10 image you can draw on. Each step shows the pixel × weight products, their sum, and the feature map filling in. Choose from basic filters (blur, sharpen), common edge detectors (Sobel, Prewitt, Laplacian, outline, emboss) and colour filters (red, green, blue, yellow, red–green edges), or write a custom kernel with your own colour-channel weights. Change stride and padding. Then run the same kernel over a 160×160 image (sample scene or your own upload). |
| **Pooling** | Step through max or average pooling with 2×2 or 3×3 windows and stride 1 or 2. The winning cell is highlighted. You can pool the feature map from the Convolution tab, and watch a real feature map pooled three times (160 → 80 → 40 → 20). |
| **RNN** | Type a short word and watch it get read one character at a time. The unrolled view shows the hidden state carrying memory forward, with each step broken into `W_xh·x_t + W_hh·h_{t-1} + b → tanh`. |
| **Attention** | The mechanism inside LLMs. Click any word in a sentence to see how much it attends to every other word, switch between hand-built and random heads, toggle the GPT-style causal mask, and follow one row from `q·k` through `÷√d` and softmax to the new vector. |

Weights in the dense network and RNN are random, not trained. The goal is to show the mechanics, not to make predictions.

## Project structure

```
index.html       page shell and tab markup
css/style.css    styles
js/helpers.js    shared utilities: colour scales, grids, seeded RNG, routing
js/perceptron.js Perceptron chapter
js/conv.js       Convolution tab
js/pool.js       Pooling tab
js/mlp.js        Dense network tab
js/rnn.js        RNN tab
js/attn.js       Attention tab
js/main.js       starts the router
```

The page is one article with six chapters: perceptron, dense networks, convolution, pooling, RNNs and attention. Each chapter is a self-contained `<section id="tab-…">` with its own script; to add one, add a section, a contents link and a script.

## Roadmap

- [ ] LSTM / GRU with gates visualised
- [ ] Full CNN pipeline: conv → pool → flatten → dense on a hand-drawn digit
- [x] Attention (single head, causal mask)
- [ ] Full transformer block: multi-head + feed-forward + residuals
- [ ] Backpropagation view for the dense network

## License

MIT © Renfred Alonge

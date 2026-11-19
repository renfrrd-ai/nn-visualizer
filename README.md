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
| **Convolution** | Watch a 3×3 kernel slide over a 10×10 image you can draw on. Each step shows the pixel × weight products, their sum, and the feature map filling in. Choose a preset kernel (Sobel edges, outline, sharpen, blur, identity) or type your own. Change stride and padding. Then run the same kernel over a 160×160 image (sample scene or your own upload). |
| **Pooling** | Step through max or average pooling with 2×2 or 3×3 windows and stride 1 or 2. The winning cell is highlighted. You can pool the feature map from the Convolution tab, and watch a real feature map pooled three times (160 → 80 → 40 → 20). |
| **Dense network** | A 3–4–4–2 fully connected network. Move the inputs, animate the forward pass, switch activations (ReLU, tanh, sigmoid), and click any neuron to see `z = Σ w·a + b` with the real numbers. |
| **RNN** | Type a short word and watch it get read one character at a time. The unrolled view shows the hidden state carrying memory forward, with each step broken into `W_xh·x_t + W_hh·h_{t-1} + b → tanh`. |

Weights in the dense network and RNN are random, not trained. The goal is to show the mechanics, not to make predictions.

## Project structure

```
index.html       page shell and tab markup
css/style.css    styles
js/helpers.js    shared utilities: colour scales, grids, seeded RNG, tab routing
js/conv.js       Convolution tab
js/pool.js       Pooling tab
js/mlp.js        Dense network tab
js/rnn.js        RNN tab
js/main.js       starts the router
```

Each tab is a self-contained `<section id="tab-…">` with its own script. To add a new network type, add a section, a nav link and a script, and the router picks it up automatically.

## Roadmap

- [ ] LSTM / GRU with gates visualised
- [ ] Full CNN pipeline: conv → pool → flatten → dense on a hand-drawn digit
- [ ] Attention / transformer block
- [ ] Backpropagation view for the dense network

## License

MIT © Renfred Alonge

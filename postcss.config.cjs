// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ this replaces `tailwindcss: {}`
    autoprefixer: {},
  },
};

-- Markdown rendering + inline images
return {
  -- Markdown: inline rendered preview, ON by default
  {
    "MeanderingProgrammer/render-markdown.nvim",
    dependencies = { "nvim-treesitter/nvim-treesitter", "nvim-tree/nvim-web-devicons" },
    -- cmd lets <leader>mm work from any buffer (it loads the plugin first)
    cmd = { "RenderMarkdown" },
    ft = "markdown",
    opts = {
      enabled = true,
      render_modes = { "n", "c", "t" },
      heading = { enabled = true },
      code = { enabled = true },
      bullet = { enabled = true },
      checkbox = { enabled = true },
    },
  },

  -- Markdown: browser preview (like VSCode's preview pane)
  {
    "iamcco/markdown-preview.nvim",
    cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
    build = "cd app && npm install",
    init = function()
      vim.g.mkdp_filetypes = { "markdown" }
      vim.g.mkdp_auto_close = 0
    end,
    ft = "markdown",
  },

  -- Images inside Neovim via Ghostty's kitty graphics protocol:
  --   opening a .png/.jpg/.gif/.webp/.heic shows the picture,
  --   images in markdown show on hover (cursor on the link).
  -- Non-PNG formats need ImageMagick (`magick`).
  {
    "folke/snacks.nvim",
    priority = 1000,
    lazy = false,
    opts = {
      image = {
        enabled = true,
        doc = { enabled = true, inline = false, float = true, max_width = 80, max_height = 40 },
      },
    },
  },
}

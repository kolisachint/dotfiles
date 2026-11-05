-- Theme, statusline, file explorers
return {
  { "nvim-tree/nvim-web-devicons", lazy = true },

  -- Catppuccin Latte (day) / Mocha (night): kept installed as fallback.
  -- Was: follows macOS appearance via apply_system_theme. Parked while
  -- trying Kanagawa Dragon. Revert: set lazy = false here, remove the
  -- kanagawa spec below, and restore the FocusGained/timer re-check.
  {
    "catppuccin/nvim",
    name = "catppuccin",
    lazy = true,
    priority = 1000,
    config = function()
      require("catppuccin").setup({
        flavour = "auto",
        background = { light = "latte", dark = "mocha" },
        integrations = {
          blink_cmp = true,
          gitsigns = true,
          diffview = true,
          neogit = true,
          mason = true,
          nvimtree = true,
          telescope = { enabled = true },
          which_key = true,
          native_lsp = { enabled = true },
          render_markdown = true,
          snacks = { enabled = true },
        },
      })
    end,
  },

  -- Kanagawa Dragon (trial): fixed dark theme from rebelot/kanagawa.nvim
  -- https://github.com/rebelot/kanagawa.nvim
  {
    "rebelot/kanagawa.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("kanagawa").setup({
        theme = "dragon",
        background = { dark = "dragon", light = "dragon" },
        commentStyle = { italic = true },
        keywordStyle = { italic = true },
        statementStyle = { bold = true },
        terminalColors = true,
        -- Hybrid contrast: AAA (>= 7:1) for code + diagnostics, stock
        -- Dragon dull for comments + punctuation (dull by design).
        -- Same OKLCH hues as stock (mirrors rex + hoocode themes).
        -- Revert: delete this colors block.
        colors = {
          palette = {
            -- dragonAsh (comments, 4.17:1) and dragonGray2 (punctuation)
            -- deliberately left stock: dull by design.
            dragonGreen2 = "#a9ba99", -- strings  (was #8a9a7b)
            dragonBlue2 = "#9fb9c5", -- functions (was #8ba4b0)
            dragonViolet = "#c1cce1", -- keywords (was #8992a7)
            dragonAqua = "#a2b9b6", -- types     (was #8ea4a2)
            dragonPink = "#c0b0c1", -- numbers   (was #a292a3)
            dragonRed = "#f39f97", -- operators  (was #c4746e)
            dragonOrange = "#d2ad95", -- constants (was #b6927b)
            dragonTeal = "#98a3b9", -- specials  (was #949fb5)
            dragonBlue = "#86a8b7", -- diag info (was #658594)
            waveAqua1 = "#80ac9f", -- diag hint  (was #6a9589)
            samuraiRed = "#fc7d6f", -- diag error (was #e82424)
          },
        },
      })
      vim.o.background = "dark"
      vim.cmd("colorscheme kanagawa-dragon")
    end,
  },

  -- VSCode-like statusline
  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    opts = {
      options = { theme = "auto" }, -- follows the active catppuccin flavour
      sections = {
        -- Macro recording shows here (showmode is off to save a row)
        lualine_x = {
          {
            function() return "REC @" .. vim.fn.reg_recording() end,
            cond = function() return vim.fn.reg_recording() ~= "" end,
          },
          "encoding",
          "fileformat",
          "filetype",
        },
        -- [read] error counts as "E:2 W:1", not just colored icons
        lualine_b = {
          "branch",
          "diff",
          { "diagnostics", symbols = { error = "E:", warn = "W:", info = "I:", hint = "H:" } },
        },
      },
    },
  },

  -- File tree (left side, like Zed/VSCode)
  {
    "nvim-tree/nvim-tree.lua",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function()
      require("nvim-tree").setup({
        view = { side = "left", width = 30, preserve_window_proportions = true },
        renderer = {
          highlight_git = true,
          icons = { show = { git = true, file = true, folder = true } },
        },
        actions = { open_file = { quit_on_open = false } },
        update_focused_file = { enable = true },
        git = { enable = true },
        -- oil.nvim handles `nvim <dir>`; nvim-tree must not take over folders
        disable_netrw = false,
        hijack_netrw = false,
        hijack_directories = { enable = false },
      })
    end,
  },

  -- oil.nvim: press "-" to edit the current folder like a text buffer
  -- (rename = edit the line, delete = dd, create = type a new line, :w applies)
  {
    "stevearc/oil.nvim",
    lazy = false,
    dependencies = { "nvim-tree/nvim-web-devicons" },
    keys = { { "-", "<cmd>Oil<cr>", desc = "Edit parent folder (oil)" } },
    opts = {
      default_file_explorer = true, -- `nvim <dir>` opens oil
      view_options = { show_hidden = true },
      float = { border = "rounded" },
    },
  },
}

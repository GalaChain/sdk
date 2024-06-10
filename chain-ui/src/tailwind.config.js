/* eslint-disable @typescript-eslint/no-var-requires */
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');
const headlessUiPlugin = require('@headlessui/tailwindcss');
const { tailwindcssOriginSafelist } = require('@headlessui-float/vue');

// for primevue theme
const themeColors = {
  fuchsia: {
    500: '190 51 255', // #be33ff
  },
  brightgreen: {
    300: '51 255 169', // #33ffa9
  },
  teal: {
    500: '0 97 92', // #00615c
  },
  vibrantBlue: {
    100: '204 212 255', // #ccd4ff
    200: '153 169 255', // #99a9ff
    300: '102 126 255', // #667eff
    400: '51 83 255', // #3353ff
    500: '0 40 255', // #0028ff
    600: '0 32 204', // #0020cc
    700: '0 8 51', // #000833
    800: '0 16 102', // #001066
    900: '0 8 51', // #000833
  },
  primary: {
    50: '230 241 255', // #e6f1ff
    100: '204 227 255', // #cce3ff
    150: '179 213 255', // #b3d5ff
    200: '153 199 255', // #99c7ff
    250: '128 185 255', // #80b9ff
    300: '102 171 255', // #66abff
    350: '77 157 255', // #4d9dff
    400: '51 143 255', // #338fff
    450: '26 129 255', // #1a81ff
    500: '0 115 255', // #0073ff
    550: '0 104 230', // #0068e6
    600: '0 92 204', // #005ccc
    650: '0 81 179', // #0051b3
    700: '0 69 153', // #004599
    750: '0 58 128', // #003a80
    800: '0 46 102', // #002e66
    850: '0 34 76', // #00224c
    900: '0 23 51', // #001733
    950: '0 11 25', // #000b19
  },
  surface: {
    0: '255 255 255', // #FFFFFF
    50: '242 242 242', // #f2f2f2
    100: '230 230 230', // #e6e6e6
    150: '217 217 217', // #d9d9d9
    200: '204 204 204', // #cccccc
    250: '192 192 192', // #c0c0c0
    300: '181 181 181', // #B5B5B5
    350: '166 166 166', // #a6a6a6
    400: '153 153 153', // #999999
    450: '141 141 141', // #8d8d8d
    500: '128 128 128', // #808080
    550: '115 115 115', // #737373
    600: '102 102 102', // #666666
    650: '90 90 90', // #5a5a5a
    700: '77 77 77', // #4d4d4d
    750: '64 64 64', // #404040
    800: '51 51 51', // #333333
    850: '38 38 38', // #262626
    900: '26 26 26', // #1A1A1A
    910: '25 25 25', // #191919
    925: '18 18 18', // #121212
    950: '11 11 11', // #0B0B0B
    1000: '0 0 0', // #000000
  },
};

const extendGridCols = (count) => {
  const start = 13; // tailwind already has 1-12
  const extendTheme = {
    gridColumn: {},
    gridColumnEnd: {},
    gridColumnStart: {},
    gridTemplateColumns: {
      [count]: `repeat(${count}, minmax(0, 1fr))`,
    },
  };
  for (let i = start; i <= count + 1; i++) {
    extendTheme.gridColumnEnd[i] = `${i}`;
    extendTheme.gridColumnStart[i] = `${i}`;
    extendTheme.gridColumn[`span-${i}`] = `span ${i} / span ${i}`;
  }
  return extendTheme;
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './theme/primevue/**/*.js',
    './app.vue',
    './error.vue',
  ],
  darkMode: 'class',
  safelist: [...tailwindcssOriginSafelist],
  theme: {
    extend: {
      ...extendGridCols(24),
      animation: {
        'y-shake': 'y-shake 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s infinite',
        'y-shake-2': 'y-shake 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s 2',
        ellipsis: 'ellipsis steps(4,end) 900ms infinite',
      },
      backgroundImage: {
        'linear-angled-vibrant':
          'linear-gradient(42deg, rgba(var(--vibrantBlue-400)/0) 0%, rgba(var(--vibrantBlue-400)/1) 50%)',
        'loading-indicator':
          'repeating-linear-gradient(to right, rgb(var(--fuchsia-500)) 0%, rgb(var(--primary-500)) 50%, rgb(var(--primary-200)) 100%)',
        'glow-outer-light':
          'radial-gradient(closest-side, rgba(var(--surface-850)/0.08) 0%, rgba(var(--surface-850)/0) 100%)',
        'glow-outer-dark':
          'radial-gradient(closest-side, rgba(var(--surface-150)/0.08) 0%, rgba(var(--surface-150)/0) 100%)',
        'radial-gradient':
          'radial-gradient(closest-side, rgba(var(--brightgreen-300)/0.3) 0%, rgba(var(--brightgreen-300)/0) 100%)',
        'translucent-border-dark':
          'linear-gradient(to right, rgba(var(--surface-800)), rgba(var(--surface-800) / 0)), linear-gradient(to right, rgba(var(--surface-800)), rgba(var(--surface-800) / 0))',
        'translucent-border-light':
          'linear-gradient(to right, rgba(var(--surface-200)), rgba(var(--surface-200) / 0)), linear-gradient(to right, rgba(var(--surface-200)), rgba(var(--surface-200) / 0))',
      },
      colors: {
        galablue: {
          200: '#b1dbff',
          500: '#0084f8',
          600: '#006ac7',
        },
        error: {
          500: '#e71d36',
        },
        // for primevue theme
        ...Object.keys(themeColors).reduce((acc, color) => {
          const colorShades = Object.keys(themeColors[color]).reduce(
            (acc, shade) => {
              acc[`${color}-${shade}`] = `rgb(var(--${color}-${shade}))`;
              return acc;
            },
            {}
          );
          return {
            ...acc,
            ...colorShades,
          };
        }, {}),
      },
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        'y-shake': {
          '0%, 100%': { marginLeft: '0rem' },
          '25%': { marginLeft: '0.2rem' },
          '75%': { marginLeft: '-0.2rem' },
        },
        ellipsis: {
          to: {
            width: '1.25em',
          },
        },
      },
      screens: {
        xs: '400px',
        md2: '840px',
        '3xl': '1920px',
      },
      spacing: {
        'footer-gap': '13rem',
      },
    },
  },
  plugins: [
    headlessUiPlugin,
    plugin(function ({ addBase, addComponents, addVariant }) {
      addBase({
        ':root': Object.keys(themeColors).reduce((acc, color) => {
          const colorShades = Object.keys(themeColors[color]).reduce(
            (acc, shade) => {
              acc[`--${color}-${shade}`] = themeColors[color][shade];
              return acc;
            },
            {}
          );
          return {
            ...acc,
            ...colorShades,
          };
        }, {}),
      });
      addVariant('hocus', ['&:hover', '&:focus']);
      addComponents({
        '.cta-md': {
          '@apply text-sm px-4 py-2': {},
        },
        '.cta-lg': {
          '@apply px-6 py-3': {},
        },
        '.cta-primary': {
          '@apply bg-galablue-600 text-white font-medium rounded-full transition-colors':
            {},
          '@apply hocus:bg-galablue-500': {},
        },
        '.cta-danger': {
          '@apply bg-rose-700 text-white font-medium rounded-full transition-colors':
            {},
          '@apply hocus:bg-rose-600': {},
        },
        '.page-title': {
          '@apply text-2xl sm:text-3xl md:text-4xl': {},
        },
        '.heading-secondary': {
          '@apply text-xl md:text-2xl': {},
        },
        '.heading-small': {
          '@apply leading-none text-xs uppercase lg:w-auto text-surface-secondary':
            {},
        },
        '.container-padding': {
          '@apply px-4 sm:px-6 md:px-8': {},
        },
        '.grid-default': {
          '@apply grid grid-cols-24 xs:gap-3 md:gap-4': {},
        },
        '.focus-ring': {
          '@apply outline-none ring-2 ring-surface-1000 dark:ring-surface-0':
            {},
        },
        '.focus-ring-offset': {
          '@apply ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-1000':
            {},
        },
        '.prime-tablehead': {
          '>tr:first-child>th': {},
        },
        '.prime-tablebody': {
          '&:last-child>tr:last-child>td': {},
        },
        '.prime-tablefoot': {
          '>tr:last-child>td': {},
        },
        '.frozen-col-left': {
          '&:before': {
            '@apply absolute right-0 top-0 translate-x-full w-6 h-full bg-gradient-to-r from-surface-50 dark:from-surface-925 to-surface-50/0 dark:to-surface-925/0':
              {},
            content: '""',
          },
        },
        '.frozen-col-right': {
          '&:before': {
            '@apply absolute left-0 top-0 -translate-x-full w-6 h-full bg-gradient-to-l from-surface-50 dark:from-surface-925 to-surface-50/0 dark:to-surface-925/0':
              {},
            content: '""',
          },
        },
        '.text-surface-primary': {
          '@apply text-surface-950 dark:text-surface-0': {},
        },
        '.text-surface-primary-inverted': {
          '@apply text-surface-0 dark:text-surface-950': {},
        },
        '.text-surface-secondary': {
          '@apply text-surface-600 dark:text-surface-400': {},
        },
        '.has-floating-label': {
          '@apply relative': {},
        },
        '.loading-ellipsis': {
          '&:after': {
            '@apply font-serif inline-block align-bottom overflow-hidden animate-ellipsis w-0':
              {},
            content: '"\\2026"',
          },
        },
        '.tooltip-text': {
          '@apply bg-surface-250 dark:bg-surface-850 ring-1 ring-inset ring-surface-300 dark:ring-surface-800 rounded-md whitespace-pre-line break-words':
            {},
        },
        '.gradient-shape': {
          background: `radial-gradient(
            ellipse closest-side,
            var(--ellipse-bg-color) 50%,
            rgba(0, 0, 0, 0) 100%
          )`,
          width: 'var(--ellipse-width)',
          height: 'var(--ellipse-height)',
          filter: 'blur(var(--ellipse-blur, 50px))',
        },
        '.dialog-gradient-shape': {
          '@apply absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:-translate-y-3/4':
            {},
          '--ellipse-bg-color': 'rgba(var(--primary-500) / 0.25)',
          '--ellipse-width': '100%',
          '--ellipse-height': '50%',
          '@screen sm': {
            '--ellipse-height': '150%',
          },
        },
        '.custom-scrollbar': {
          '@apply [scrollbar-color:rgba(var(--surface-1000)/0.1)_rgb(var(--surface-50))] dark:[scrollbar-color:rgba(var(--surface-0)/0.1)_rgb(var(--surface-925))]':
            {},
          '&::-webkit-scrollbar': {
            width: '12px',
            '&-track': {
              '@apply bg-surface-50 dark:bg-surface-925': {},
            },
            '&-thumb': {
              '@apply bg-surface-1000/10 dark:bg-surface-0/10 border border-surface-50 dark:border-surface-925 border-solid':
                {},
              borderRadius: '10px',
            },
          },
        },
      });
    }),
  ],
};

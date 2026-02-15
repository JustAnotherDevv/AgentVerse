export const theme = {
  colors: {
    background: {
      primary: '#1a1612',
      secondary: '#252019',
      tertiary: '#2e251f',
      panel: '#362d24',
    },
    accent: {
      primary: '#d4a857',
      secondary: '#e8dcc4',
      tertiary: '#b8956c',
      gold: '#ffd700',
      magic: '#d4a857',
      health: '#c97878',
      mana: '#d4a857',
      warning: '#d4a857',
      error: '#c97878',
    },
    text: {
      primary: '#e8dcc4',
      secondary: '#b8a080',
      tertiary: '#7a6a50',
      muted: '#4a4030',
      gold: '#ffd700',
      inverse: '#1a1612',
    },
    border: {
      default: '#4a4030',
      subtle: '#3a3025',
      emphasis: '#6a5a40',
      gold: '#8b7355',
    },
    ui: {
      parchment: '#c9b896',
      ink: '#2e251f',
      wood: '#4a3520',
      gold: '#d4a857',
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "Fira Code", monospace',
    serif: '"Cinzel", "Trajan Pro", "Palatino", serif',
    display: '"Cinzel Decorative", serif',
    body: '"Crimson Text", "Palatino Linotype", serif',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '26px',
    '3xl': '32px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
};

export const fantasyStyle = {
  parchment: `
    background: linear-gradient(135deg, #c9b896 0%, #a89870 100%);
    border: 2px solid #8b7355;
  `,
  ornateBorder: `
    border: 2px solid #8b7355;
    box-shadow: 
      inset 0 0 20px rgba(0,0,0,0.3),
      0 4px 8px rgba(0,0,0,0.5);
  `,
  goldTrim: `
    border: 1px solid #d4a857;
    box-shadow: 0 0 10px rgba(212, 168, 87, 0.3);
  `,
  glow: `
    text-shadow: 0 0 10px rgba(212, 168, 87, 0.5);
  `,
  buttonHover: `
    background: linear-gradient(180deg, #d4a857 0%, #a88840 100%);
    box-shadow: 0 0 15px rgba(212, 168, 87, 0.5);
  `,
};

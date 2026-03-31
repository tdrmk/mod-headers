// Base Web design tokens (light theme)
// https://baseweb.design/guides/theming/

export const colors = {
  // Backgrounds
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F6F6F6',
  backgroundTertiary: '#EEEEEE',

  // Content
  contentPrimary: '#000000',
  contentSecondary: '#545454',
  contentTertiary: '#767676',
  contentInversePrimary: '#FFFFFF',

  // Borders — Border/*, Border++/*
  borderOpaque: '#E2E2E2',       // Border/borderOpaque — card edges, dividers
  borderAccessible: '#CBCBCB',   // Border/borderAccessible — 3:1 contrast on neutral bg
  borderSelected: '#000000',     // Border/borderSelected — focused/active state

  // Primitive mono scale
  mono900: '#333333',
  mono1000: '#000000',

  // Semantic
  primary: '#000000',
  primaryA: '#000000',
  primaryB: '#FFFFFF',

  positive: '#1EA896',
  positiveLight: 'rgba(30, 168, 150, 0.16)',
}

export const typography = {
  fontFamily: 'system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
  scale100: '11px',  // label / caption
  scale200: '12px',  // small
  scale300: '13px',  // sub-body
  scale400: '14px',  // body default
  scale500: '16px',  // heading small
  scale600: '20px',  // heading
}

export const borders = {
  radius100: '4px',   // small
  radius200: '8px',   // medium (buttons, cards)
  radius300: '12px',  // large
}

export const sizing = {
  scale100: '4px',
  scale200: '8px',
  scale300: '12px',
  scale400: '16px',
  scale500: '20px',
  scale600: '24px',
}

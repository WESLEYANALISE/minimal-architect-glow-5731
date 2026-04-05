
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				'source-sans': ['Source Sans 3', 'system-ui', 'sans-serif'],
				'serif-content': ['Source Serif 4', 'Georgia', 'serif'],
				'cinzel': ['Cinzel', 'serif'],
				'condensed': ['Oswald', 'sans-serif'],
				'legal': ['Crimson Text', 'Georgia', 'serif'],
				'playfair': ['Playfair Display', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				rest: {
					blue: '#0077B6',
					lightblue: '#90E0EF',
					darkblue: '#03045E',
					cyan: '#00B4D8',
					light: '#000000',
					dark: '#FFFFFF'
				},
				'navy-card': 'hsl(var(--navy-card))',
				'navy-gradient-start': 'hsl(var(--navy-gradient-start))',
				'navy-gradient-end': 'hsl(var(--navy-gradient-end))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'scrollLeft': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(-50%)' }
				},
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				'fade-in-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-from-bottom': {
					'0%': {
						opacity: '0',
						transform: 'translateY(100%)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'shake': {
					'0%, 100%': {
						transform: 'translateX(0)'
					},
					'25%': {
						transform: 'translateX(-4px)'
					},
					'75%': {
						transform: 'translateX(4px)'
					}
				},
			'bounceRight': {
				'0%, 100%': {
					transform: 'translateX(0)'
				},
				'50%': {
					transform: 'translateX(4px)'
				}
			},
			'bounceX': {
				'0%, 100%': {
					transform: 'translateX(0)'
				},
				'50%': {
					transform: 'translateX(6px)'
				}
			},
				'pulse-success': {
					'0%, 100%': {
						transform: 'scale(1)',
						opacity: '1'
					},
					'50%': {
						transform: 'scale(1.02)',
						opacity: '0.95'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'wave-pulse': {
					'0%, 100%': {
						transform: 'scaleY(0.3)'
					},
					'50%': {
						transform: 'scaleY(1)'
					}
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(var(--primary), 0.3)'
					},
					'50%': {
						boxShadow: '0 0 40px rgba(var(--primary), 0.6)'
					}
				},
				'bounce-in': {
					'0%': {
						transform: 'scale(0)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(1.1)'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				},
				'slide-up-fade': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)',
						filter: 'blur(4px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)',
						filter: 'blur(0)'
					}
				},
				'slide-in-right': {
					'0%': {
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-out-right': {
					'0%': {
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(100%)',
						opacity: '0'
					}
				},
				'press': {
					'0%': {
						transform: 'scale(1)'
					},
					'50%': {
						transform: 'scale(0.95)'
					},
					'100%': {
						transform: 'scale(1)'
					}
				},
				'pop': {
					'0%': {
						transform: 'scale(0.9)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(1.02)'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
			'slide-down': {
				'0%': {
					opacity: '0',
					transform: 'translateY(-10px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			'slide-in-left': {
				'0%': {
					opacity: '0',
					transform: 'translateX(-30px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateX(0)'
				}
			},
			'slide-in-right-card': {
				'0%': {
					opacity: '0',
					transform: 'translateX(30px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateX(0)'
				}
			},
			'soft-bounce': {
				'0%': { transform: 'scale(1) translateZ(0)' },
				'40%': { transform: 'scale(0.92) translateZ(0)' },
				'70%': { transform: 'scale(1.03) translateZ(0)' },
				'100%': { transform: 'scale(1) translateZ(0)' }
			},
			'sound-wave': {
				'0%, 100%': { transform: 'scaleY(0.4) translateZ(0)', opacity: '0.6' },
				'50%': { transform: 'scaleY(1) translateZ(0)', opacity: '1' }
			},
			'stagger-in': {
				'0%': { opacity: '0', transform: 'translateY(8px) translateZ(0)' },
				'100%': { opacity: '1', transform: 'translateY(0) translateZ(0)' }
			},
			'sound-float-pulse': {
				'0%, 100%': { transform: 'scale(1) translateZ(0)', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' },
				'50%': { transform: 'scale(1.05) translateZ(0)', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }
			},
			'page-enter': {
				'0%': { transform: 'translateX(100%)' },
				'40%': { transform: 'translateX(0%)' },
				'100%': { transform: 'translateX(0%)' }
			},
			'countdown-stomp': {
				'0%': { opacity: '0', transform: 'scale(2.5) translateY(-40px)' },
				'50%': { opacity: '1', transform: 'scale(0.9) translateY(4px)' },
				'70%': { transform: 'scale(1.05) translateY(-2px)' },
				'100%': { transform: 'scale(1) translateY(0)' }
			},
			'border-beam': {
				'100%': { offsetDistance: '100%' }
			},
			'shine-border': {
				'0%': { '--shine-angle': '0deg' } as any,
				'100%': { '--shine-angle': '360deg' } as any,
			},
			'spotlight': {
				'0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
				'100%': { opacity: '1', transform: 'translate(-50%, -40%) scale(1)' }
			},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.15s ease-out',
				'fade-in-fast': 'fade-in 0.1s ease-out',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'spin-slow': 'spin 8s linear infinite',
				'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'shake': 'shake 0.4s ease-in-out',
				'pulse-success': 'pulse-success 0.6s ease-in-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'scale-in-fast': 'scale-in 0.15s ease-out',
				'wave-pulse': 'wave-pulse 1s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'shimmer': 'shimmer 2s linear infinite',
				'slide-up-fade': 'slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'press': 'press 0.15s ease-out',
				'pop': 'pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			'slide-down': 'slide-down 0.3s ease-out',
			'slide-in-left': 'slide-in-left 0.25s ease-out',
			'slide-in-right-card': 'slide-in-right-card 0.25s ease-out',
			'soft-bounce': 'soft-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
			'sound-wave': 'sound-wave 0.8s ease-in-out infinite',
			'stagger-in': 'stagger-in 0.3s ease-out both',
			'sound-float-pulse': 'sound-float-pulse 2s ease-in-out infinite',
			'page-enter': 'page-enter 200ms ease-out',
			'countdown-stomp': 'countdown-stomp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
			'bounceX': 'bounceX 1.5s ease-in-out infinite',
			'border-beam': 'border-beam var(--duration, 15s) infinite linear',
			'shine-border': 'shine-border var(--duration, 14s) infinite linear',
			'spotlight': 'spotlight 2s ease 0.75s 1 forwards',
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("tailwindcss-safe-area")],
} satisfies Config;

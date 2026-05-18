import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Feedback {
  id: string
  name: string
  text: string
  date: string
  visible: boolean
}

export type SpecialThemeId = 'default' | 'medical' | 'engineering' | 'education' | 'birthday'

interface FeedbackState {
  comments: Feedback[]
  videoUrl: string
  logoUrl: string
  accentColor: string
  themeMode: 'dark' | 'light' | 'system'
  lang: 'AR' | 'EN'
  mounted: boolean
  specialTheme: SpecialThemeId
  userName: string
  userAvatar: string
  userAvatarColor: string
  userAvatarType: 'image' | 'color'
  isPlaying: boolean
  setIsPlaying: (val: boolean) => void
  setUserName: (name: string) => void
  setUserAvatar: (url: string) => void
  setUserAvatarColor: (color: string) => void
  setUserAvatarType: (type: 'image' | 'color') => void
  addComment: (comment: Omit<Feedback, 'id' | 'visible'>) => void
  toggleVisibility: (id: string) => void
  deleteComment: (id: string) => void
  setVideoUrl: (url: string) => void
  setLogoUrl: (url: string) => void
  setAccentColor: (color: string) => void
  setThemeMode: (mode: 'dark' | 'light' | 'system') => void
  setLang: (lang: 'AR' | 'EN') => void
  setMounted: (val: boolean) => void
  setSpecialTheme: (id: SpecialThemeId) => void
  roadmapNodes: Array<{ label: string, desc: string, x: number, y: number, completed: boolean }>
  setRoadmapNodes: (nodes: Array<{ label: string, desc: string, x: number, y: number, completed: boolean }>) => void
  claimedAchievements: string[]
  claimAchievement: (id: string) => void
  lastStreakClaimDate: string | null
  claimStreakReward: () => void
  equippedFrame: string
  setEquippedFrame: (frameId: string) => void
  lastMysteryBoxClaimDate: string | null
  claimMysteryBox: () => void
  soundEffectsEnabled: boolean
  toggleSoundEffects: () => void
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      comments: [
        { id: '1', name: 'سارة أحمد', text: 'اللعبة ممتعة جداً والتصميم خيالي!', date: 'منذ يومين', visible: true },
        { id: '2', name: 'محمد خالد', text: 'أفضل منصة تريفيا عربية جربتها حتى الآن.', date: 'أمس', visible: true },
        { id: '3', name: 'ليلى علي', text: 'أحببت شخصية أبو العريف، ذكي ومضحك!', date: 'منذ ٣ ساعات', visible: true },
        { id: '4', name: 'أحمد منصور', text: 'تحديات ذكية ومنافسة شريفة، فخور بهذا العمل.', date: 'منذ يومين', visible: true },
        { id: '5', name: 'ريم السعدي', text: 'أفضل استثمار لوقت الفراغ مع الأصدقاء.', date: 'منذ ٤ ساعات', visible: true },
        { id: '6', name: 'يوسف جمال', text: 'المؤثرات الصوتية والبصرية في اللعبة عالمية.', date: 'منذ ٥ ساعات', visible: true },
      ],
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-star-field-in-deep-space-34356-large.mp4',
      logoUrl: '/logo.png',
      accentColor: '#8B5CF6',
      themeMode: 'system',
      lang: 'AR',
      mounted: false,
      specialTheme: 'default',
      userName: '',
      userAvatar: '',
      userAvatarColor: '#8B5CF6',
      userAvatarType: 'color',
      isPlaying: false,
      claimedAchievements: [],
      lastStreakClaimDate: null,
      equippedFrame: 'none',
      lastMysteryBoxClaimDate: null,
      soundEffectsEnabled: true,
      roadmapNodes: [
        { label: 'المتجر العالمي', desc: 'أدوات تجميلية وحزم حصرية', x: 15, y: 30, completed: true },
        { label: 'البطولات الكبرى', desc: 'جوائز نقدية وتصنيف عالمي', x: 55, y: 20, completed: false },
        { label: 'نظام القبائل', desc: 'كوّن فريقك وسيطر على اللوحة', x: 35, y: 70, completed: false },
        { label: 'تطبيق الهاتف', desc: 'العُريف في جيبك أينما كنت', x: 75, y: 60, completed: false },
      ],
      setIsPlaying: (val) => set({ isPlaying: val }),
      setUserName: (name) => set({ userName: name }),
      setUserAvatar: (url) => set({ userAvatar: url }),
      setUserAvatarColor: (color) => set({ userAvatarColor: color }),
      setUserAvatarType: (type) => set({ userAvatarType: type }),
      addComment: (c) => set((state) => ({
        comments: [{ ...c, id: Math.random().toString(36).substr(2, 9), visible: false }, ...state.comments]
      })),
      toggleVisibility: (id) => set((state) => ({
        comments: state.comments.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
      })),
      deleteComment: (id) => set((state) => ({
        comments: state.comments.filter(c => c.id !== id)
      })),
      setVideoUrl: (url) => set({ videoUrl: url }),
      setLogoUrl: (url) => set({ logoUrl: url }),
      setAccentColor: (color) => set({ accentColor: color }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setLang: (lang) => set({ lang: lang }),
      setMounted: (val) => set((state) => state.mounted === val ? state : { mounted: val }),
      setSpecialTheme: (id) => set({ specialTheme: id }),
      setRoadmapNodes: (nodes) => set({ roadmapNodes: nodes }),
      claimAchievement: (id) => set((state) => ({
        claimedAchievements: [...state.claimedAchievements, id]
      })),
      claimStreakReward: () => set({ lastStreakClaimDate: new Date().toISOString() }),
      setEquippedFrame: (frameId) => set({ equippedFrame: frameId }),
      claimMysteryBox: () => set({ lastMysteryBoxClaimDate: new Date().toISOString() }),
      toggleSoundEffects: () => set((state) => ({ soundEffectsEnabled: !state.soundEffectsEnabled })),
    }),
    {
      name: 'abu-al-areef-feedback-storage',
      partialize: (state) => ({
        lang: state.lang,
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        specialTheme: state.specialTheme,
        userName: state.userName,
        userAvatar: state.userAvatar,
        userAvatarColor: state.userAvatarColor,
        userAvatarType: state.userAvatarType,
        isPlaying: state.isPlaying,
        claimedAchievements: state.claimedAchievements,
        lastStreakClaimDate: state.lastStreakClaimDate,
        equippedFrame: state.equippedFrame,
        lastMysteryBoxClaimDate: state.lastMysteryBoxClaimDate,
        soundEffectsEnabled: state.soundEffectsEnabled,
      }),
    }
  )
)

// Web Audio API Immersive Sound System Helper
export function playSound(type: 'click' | 'claim' | 'pop' | 'chime' | 'fanfare' | 'whoosh') {
  if (typeof window === 'undefined') return
  try {
    const store = useFeedbackStore.getState()
    if (!store.soundEffectsEnabled) return

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const now = ctx.currentTime

    if (type === 'click') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.05)
    } else if (type === 'claim' || type === 'fanfare') {
      // Triumphant 3-note arpeggio
      const freqs = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      freqs.forEach((f, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(f, now + index * 0.1)
        gain.gain.setValueAtTime(0.25, now + index * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + index * 0.1)
        osc.stop(now + index * 0.1 + 0.3)
      })
    } else if (type === 'pop') {
      // Bright bubble pop
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === 'chime') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, now)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'whoosh') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'lowpass' as any
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.linearRampToValueAtTime(600, now + 0.15)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.3)
    }
  } catch { /* silent */ }
}

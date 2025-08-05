'use client'

import { useState, useRef, useEffect } from 'react'
import { Title, Body, Label } from '@krds-ui/core'

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item: (index: number) => SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item: (index: number) => SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function TestPage() {
  // TTS 상태
  const [ttsText, setTtsText] = useState('안녕하세요! TTS 테스트입니다.')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<number>(0)
  const [ttsRate, setTtsRate] = useState(1)
  const [ttsPitch, setTtsPitch] = useState(1)
  const [ttsVolume, setTtsVolume] = useState(1)

  // STT 상태
  const [sttText, setSttText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [sttSupported, setSttSupported] = useState(false)
  const [sttError, setSttError] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // TTS 초기화 및 음성 목록 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis

      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || []
        setTtsVoices(voices)

        // 한국어 음성을 기본으로 선택
        const koreanVoiceIndex = voices.findIndex(
          (voice) => voice.lang.startsWith('ko') || voice.lang.includes('KR')
        )
        if (koreanVoiceIndex !== -1) {
          setSelectedVoice(koreanVoiceIndex)
        }
      }

      loadVoices()

      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices
      }
    }
  }, [])

  // STT 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSttSupported(true)
        recognitionRef.current = new SpeechRecognition()

        if (recognitionRef.current) {
          recognitionRef.current.continuous = true
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = 'ko-KR'

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            let interim = ''
            let final = ''

            for (let i = event.results.length - 1; i >= 0; i--) {
              const result = event.results[i]
              if (result.isFinal) {
                final = result[0].transcript
              } else {
                interim = result[0].transcript
              }
            }

            setInterimTranscript(interim)
            if (final) {
              setFinalTranscript((prev) => prev + final + ' ')
              setSttText((prev) => prev + final + ' ')
            }
          }

          recognitionRef.current.onerror = (
            event: SpeechRecognitionErrorEvent
          ) => {
            setSttError(`음성 인식 오류: ${event.error}`)
            setIsListening(false)
          }

          recognitionRef.current.onend = () => {
            setIsListening(false)
            setInterimTranscript('')
          }
        }
      }
    }
  }, [])
  const speakWithGoogleTTS = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        alert('TTS 요청 실패')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
    } catch (err) {
      console.error('Google TTS 오류:', err)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  // STT 함수
  const startListening = () => {
    if (!recognitionRef.current || isListening) return

    setSttError('')
    setInterimTranscript('')

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error) {
      setSttError('음성 인식을 시작할 수 없습니다.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const clearSttText = () => {
    setSttText('')
    setFinalTranscript('')
    setInterimTranscript('')
    setSttError('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <Title size="xl" className="mb-2">
          TTS & STT 테스트 페이지
        </Title>
        <Body size="m" color="gray-60">
          Text-to-Speech와 Speech-to-Text 기능을 테스트해보세요
        </Body>
      </div>

      {/* TTS 섹션 */}
      <div className="bg-white rounded-lg border border-gray-20 p-6">
        <Title size="l" className="mb-4">
          🔊 TTS (Text-to-Speech)
        </Title>

        <div className="space-y-4">
          {/* 텍스트 입력 */}
          <div>
            <Label size="m" weight="bold" className="block mb-2">
              읽을 텍스트
            </Label>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              className="w-full p-3 border border-gray-30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-50"
              rows={3}
              placeholder="읽을 텍스트를 입력하세요..."
            />
          </div>

          {/* TTS 컨트롤 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={() => speakWithGoogleTTS(ttsText)}
              disabled={isSpeaking || !ttsText.trim()}
              className="px-6 py-2 bg-primary-60 text-white rounded-md hover:bg-primary-70 disabled:bg-gray-30 disabled:cursor-not-allowed transition-colors"
            >
              {isSpeaking ? '재생 중...' : '음성 재생'}
            </button>
            <button
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              className="px-6 py-2 bg-danger-60 text-white rounded-md hover:bg-danger-70 disabled:bg-gray-30 disabled:cursor-not-allowed transition-colors"
            >
              정지
            </button>
          </div>
        </div>
      </div>

      {/* STT 섹션 */}
      <div className="bg-white rounded-lg border border-gray-20 p-6">
        <Title size="l" className="mb-4">
          🎤 STT (Speech-to-Text)
        </Title>

        {!sttSupported ? (
          <div className="text-center py-8">
            <Body size="m" color="danger-60">
              이 브라우저는 음성 인식을 지원하지 않습니다.
              <br />
              Chrome, Edge, Safari 등의 브라우저를 사용해주세요.
            </Body>
          </div>
        ) : (
          <div className="space-y-4">
            {/* STT 컨트롤 */}
            <div className="flex gap-4">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`px-6 py-2 rounded-md text-white transition-colors ${
                  isListening
                    ? 'bg-danger-60 hover:bg-danger-70'
                    : 'bg-success-60 hover:bg-success-70'
                }`}
              >
                {isListening ? '🔴 녹음 중지' : '🎤 녹음 시작'}
              </button>
              <button
                onClick={clearSttText}
                className="px-6 py-2 bg-gray-50 text-gray-70 rounded-md hover:bg-gray-60 transition-colors"
              >
                텍스트 지우기
              </button>
            </div>

            {/* 실시간 음성 인식 상태 */}
            {isListening && (
              <div className="p-4 bg-success-10 border border-success-30 rounded-md">
                <Label
                  size="s"
                  weight="bold"
                  color="success-70"
                  className="block mb-1"
                >
                  실시간 음성 인식 중...
                </Label>
                <Body size="m" color="success-60">
                  {interimTranscript || '말씀해주세요...'}
                </Body>
              </div>
            )}

            {/* 오류 표시 */}
            {sttError && (
              <div className="p-4 bg-danger-10 border border-danger-30 rounded-md">
                <Body size="m" color="danger-60">
                  {sttError}
                </Body>
              </div>
            )}

            {/* 인식된 텍스트 */}
            <div>
              <Label size="m" weight="bold" className="block mb-2">
                인식된 텍스트
              </Label>
              <textarea
                value={sttText}
                onChange={(e) => setSttText(e.target.value)}
                className="w-full p-3 border border-gray-30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-50"
                rows={5}
                placeholder="음성 인식 결과가 여기에 표시됩니다..."
              />
            </div>

            {/* STT → TTS 연동 */}
            {sttText.trim() && (
              <div className="p-4 bg-info-10 border border-info-30 rounded-md">
                <Label
                  size="s"
                  weight="bold"
                  color="info-70"
                  className="block mb-2"
                >
                  인식된 텍스트를 TTS로 재생해보세요
                </Label>
                <button
                  onClick={() => {
                    setTtsText(sttText)
                    setTimeout(() => speakWithGoogleTTS(sttText), 100)
                  }}
                  className="px-4 py-2 bg-info-60 text-white rounded-md hover:bg-info-70 transition-colors"
                >
                  인식된 텍스트 음성으로 재생
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

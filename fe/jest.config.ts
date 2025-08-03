import type { Config } from 'jest'

const config: Config = {
  // 1) TypeScript 트랜스파일
  preset: 'ts-jest',

  // 2) 기본 테스트 환경: jsdom
  //    → React 컴포넌트 테스트가 자연스럽게 동작
  testEnvironment: 'jsdom',

  // 3) tsconfig 경로 alias 매핑
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // tsconfig paths 의 "@/…" 규칙과 동일
  },

  // 4) 공통 setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default config

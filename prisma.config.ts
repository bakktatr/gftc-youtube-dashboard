import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL, // Render의 환경 변수를 여기서 읽어옵니다.
  },
});

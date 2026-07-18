-- Alter vector dimension from 1536 to 3072 for gemini-embedding-2
ALTER TABLE "Embedding" ALTER COLUMN "vector" TYPE vector(3072);

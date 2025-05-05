import { vi } from "vitest";

// Setup any global test requirements
vi.mock("discord.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("discord.js")>();
  return {
    ...actual,
    EmbedBuilder: vi.fn().mockImplementation(() => ({
      setTitle: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setDescription: vi.fn().mockReturnThis(),
      setTimestamp: vi.fn().mockReturnThis(),
      addFields: vi.fn().mockReturnThis(),
    })),
    Client: vi.fn(() => ({
      on: vi.fn(),
      login: vi.fn(),
      rest: { put: vi.fn() },
      user: { id: "123" },
    })),
    Routes: {
      applicationCommands: vi.fn(),
      applicationGuildCommands: vi.fn(),
    },
  };
});

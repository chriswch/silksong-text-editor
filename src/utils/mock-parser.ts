import { DialogueData } from "@/types/dialogue";

// This is a mock function that simulates parsing a Unity assets file
// In a real application, this would be replaced with actual Unity asset parsing logic
export const mockParseDialogueFile = async (
  _file: File,
): Promise<DialogueData> => {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate mock dialogue data
      const mockData: DialogueData = {
        Dirtmouth: {
          ELDERBUG_GREETING_01: {
            originalContent:
              "Hello there, traveler. Welcome to Dirtmouth, our quiet little town.",
          },
          ELDERBUG_GREETING_02: {
            originalContent:
              "Not many come to visit these days. The old kingdom beneath us has quite a reputation.",
          },
          ELDERBUG_BENCH: {
            originalContent:
              "That old bench there is a fine spot to rest and collect your thoughts.",
          },
        },
        Greenpath: {
          HORNET_ENCOUNTER: {
            originalContent: "...SHAW!",
          },
          QUIRREL_LAKE: {
            originalContent:
              "Isn't this a wonderful spot? The greenery and water here is quite unlike the rest of this area.",
          },
          MOSSKIN_HOSTILE: {
            originalContent: "Intruder... trespasser... outsider...",
          },
        },
        "City of Tears": {
          RELIC_SEEKER_GREETING: {
            originalContent:
              "Ahh, hello there! Come to explore the remnants of Hallownest's tragic past?",
          },
          MARISSA_SONG: {
            originalContent:
              "♪ Oh, the city, oh the city! How it gleams and how it cries! ♪",
          },
          FOUNTAIN_INSCRIPTION: {
            originalContent:
              "Memorial to the Hollow Knight. In its strength and sacrifice, Hallownest lasts eternal.",
          },
        },
        Deepnest: {
          DISTANT_VILLAGER: {
            originalContent: "...friend...come...closer...",
          },
          MIDWIFE_GREETING: {
            originalContent:
              "Oh my! A visitor! It's been so long since I've had the pleasure. Come closer, dear.",
          },
          WEAVER_SILK: {
            originalContent:
              "The silk... it sings to us... even now... even here...",
          },
        },
      };

      resolve(mockData);
    }, 1000);
  });
};

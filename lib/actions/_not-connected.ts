import { fail } from "@/lib/action-result";

/** The answer every action gives until the database and Better Auth are connected. */
export const notConnected = () => fail("This isn't connected to the database yet.");

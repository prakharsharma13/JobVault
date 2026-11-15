import connectDB from "./db";
import { Board, Column } from "./models";

const DEFAULT_COLUMNS = [
  {
    name: "Wish List",
    order: 0,
  },
  { name: "Applied", order: 1 },
  { name: "Interviewing", order: 2 },
  { name: "Offer", order: 3 },
  { name: "Rejected", order: 4 },
];

export async function initializeUserBoard(userId: string) {
  try {
    await connectDB();

    // Reuse the existing board if the user already has one
    let board = await Board.findOne({ userId, name: "Job Hunt" });

    if (!board) {
      try {
        board = await Board.create({
          name: "Job Hunt",
          userId,
          columns: [],
        });
      } catch (err: unknown) {
        // Handle race condition where another concurrent process created the board first
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          board = await Board.findOne({ userId, name: "Job Hunt" });
        } else {
          throw err;
        }
      }
    }

    if (!board) {
      throw new Error("Failed to initialize board for user");
    }

    // Check existing columns to avoid creating duplicates during concurrent initialization
    const existingColumns = await Column.find({ boardId: board._id }).sort({
      order: 1,
    });

    if (existingColumns.length === 0) {
      const columns = await Promise.all(
        DEFAULT_COLUMNS.map((col) =>
          Column.create({
            name: col.name,
            order: col.order,
            boardId: board!._id,
            jobApplications: [],
          })
        )
      );

      board.columns = columns.map((col) => col._id);
      await board.save();
    } else if (!board.columns || board.columns.length === 0) {
      // Backfill missing column references on board document if columns already existed
      board.columns = existingColumns.map((col) => col._id);
      await board.save();
    }

    return board;
  } catch (err) {
    throw err;
  }
}

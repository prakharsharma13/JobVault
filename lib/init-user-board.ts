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
      board = await Board.create({
        name: "Job Hunt",
        userId,
        columns: [],
      });
    }

    // Backfill the default columns whenever the board has none. This keeps the
    // function idempotent and self-heals accounts whose columns were never
    // created (e.g. created before the signup hook existed).
    if (!board.columns || board.columns.length === 0) {
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
    }

    return board;
  } catch (err) {
    throw err;
  }
}

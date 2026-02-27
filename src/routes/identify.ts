import { Router, Request, Response } from "express";
import { identifyContact } from "../services/contact";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({
        error: "At least one of email or phoneNumber must be provided",
      });
      return;
    }

    const result = await identifyContact({
      email: email || null,
      phoneNumber: phoneNumber ? String(phoneNumber) : null,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in /identify:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

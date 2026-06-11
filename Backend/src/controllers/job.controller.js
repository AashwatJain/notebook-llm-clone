import { asyncHandler } from "../utils/asyncHandler.js";
import { redis } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const result = await redis.hgetall(`job:${jobId}`);

  if (Object.keys(result).length === 0) {
    throw new ApiError(404, "JOB not found");
  }

  res.status(200).json(new ApiResponse(200, result, "JOB status retrieved"));
});

export { getJobStatus };

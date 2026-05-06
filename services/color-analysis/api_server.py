import os
import tempfile
from pathlib import Path

import stone
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="SWYF Color Analysis")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5174", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "color-analysis"}


@app.post("/stone")
async def analyze_skin_tone(file: UploadFile = File(...)):
    suffix = Path(file.filename or "upload.jpg").suffix or ".jpg"
    fd, filename = tempfile.mkstemp(suffix=suffix)
    os.close(fd)

    try:
      content = await file.read()
      Path(filename).write_bytes(content)
      result = stone.process(filename, return_report_image=False)
      result.pop("report_images", None)
      return result
    except Exception as exc:
      raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
      Path(filename).unlink(missing_ok=True)

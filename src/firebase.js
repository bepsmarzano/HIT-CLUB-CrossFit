import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://rirfzaxjrwenoebjgsul.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcmZ6YXhqcndlbm9lYmpnc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1OTg4NzIsImV4cCI6MjA5MTE3NDg3Mn0.XnUsaFPXaBdLUYzIgA6lKFxZIm3fov6D9lrsbHCKfhw"
);

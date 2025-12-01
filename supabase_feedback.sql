-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  ease_of_use INTEGER NOT NULL CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
  accuracy_of_drip_rating INTEGER NOT NULL CHECK (accuracy_of_drip_rating >= 1 AND accuracy_of_drip_rating <= 5),
  usefulness_of_recommendations INTEGER NOT NULL CHECK (usefulness_of_recommendations >= 1 AND usefulness_of_recommendations <= 5),
  additional_comments TEXT,
  app_version TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT ON public.feedback TO anon;
GRANT SELECT, INSERT ON public.feedback TO authenticated;

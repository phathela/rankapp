import { AlertCircle } from 'lucide-react';

interface YouTubeEmbedProps {
  url: string;
  className?: string;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVimeoVideoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

export default function YouTubeEmbed({ url, className = '' }: YouTubeEmbedProps) {
  const youtubeId = getYouTubeVideoId(url);
  const vimeoId = getVimeoVideoId(url);

  if (!youtubeId && !vimeoId) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>Invalid video URL: {url}</span>
      </div>
    );
  }

  if (youtubeId) {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden bg-black ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden bg-black ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Vimeo video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return null;
}

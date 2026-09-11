const platforms = [
  { name: "Meta", icon: "https://cdn.simpleicons.org/meta/0081FB" },
  { name: "TikTok", icon: "https://cdn.simpleicons.org/tiktok/FFFFFF" },
  { name: "Google", icon: "https://cdn.simpleicons.org/google/4285F4" },
  { name: "DoorDash", icon: "https://cdn.simpleicons.org/doordash/FF3008" },
  { name: "Uber Eats", icon: "https://cdn.simpleicons.org/ubereats/06C167" },
] as const;

export function PlatformStrip() {
  return (
    <section className="platform-strip" aria-label="Supported growth platforms">
      <p>One operating view across the platforms that drive demand</p>
      <div>
        {platforms.map((platform) => (
          <span key={platform.name}><img src={platform.icon} alt="" />{platform.name}</span>
        ))}
        <span className="toast-wordmark">Toast</span>
      </div>
    </section>
  );
}

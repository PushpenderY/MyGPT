const Avatar = ({ user, size = 28 }) => {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }

  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-emerald-600 flex items-center justify-center text-xs font-medium flex-shrink-0"
    >
      {initial}
    </div>
  );
};

export default Avatar;

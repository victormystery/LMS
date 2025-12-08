import React from "react";

type Props = {
    name?: string | null;
    avatarUrl?: string | null;
    sizeClass?: string; // tailwind size classes, e.g. 'w-7 h-7'
    className?: string;
    title?: string;
};

const getInitials = (name?: string | null) => {
    if (!name) return "G";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "G";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const UserAvatar: React.FC<Props> = ({ name, avatarUrl, sizeClass = "w-7 h-7", className = "", title }) => {
    const initials = getInitials(name);
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={title || name || "User avatar"}
                title={title || name || "User"}
                className={`${sizeClass} rounded-full object-cover ${className}`}
            />
        );
    }
    return (
        <div
            title={title || name || "User"}
            className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium ${className}`}
        >
            {initials}
        </div>
    );
};

export default UserAvatar;

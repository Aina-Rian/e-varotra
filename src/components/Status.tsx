import { Star, StarHalf } from "lucide-react";

interface StarStatusProps {
  status: string; // ex: "12", "-11", "00", ...
}

export function StarStatus({ status }: StarStatusProps) {
  const isNegative = status.startsWith("-");
  const code = isNegative ? status.slice(1) : status;

  // Toujours 2 étoiles, on complète avec '0' si trop court
  const starCodes = code.padEnd(2, "0").slice(0, 2);

  const renderStar = (state: string, index: number) => {
    let colorClass = "text-black"; // état 0 = demi-étoile noire

    if (state === "1") {
      colorClass = isNegative ? "text-red-600" : "text-green-600"; // demi-étoile colorée
    } else if (state === "2") {
      colorClass = isNegative ? "text-red-600" : "text-green-600"; // étoile pleine colorée
    }

    if (state === "2") {
      // pleine étoile
      return (
        <Star
          key={index}
          className={`${colorClass} w-6 h-6 inline-block ${index === 0 ? "mr-1" : ""}`}
          fill="currentColor"
          stroke="none"
        />
      );
    } else {
      // demi-étoile (StarHalf)
      return (
        <StarHalf
          key={index}
          className={`${colorClass} w-6 h-6 inline-block ${index === 0 ? "mr-1" : ""}`}
          fill="currentColor"
          stroke="none"
        />
      );
    }
  };

  return (
    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
      {starCodes.split("").map((state, idx) => renderStar(state, idx))}
    </span>
  );
}

import React from "react";

interface SkeletonLoaderProps {
  type: "conversationList" | "messageThread" | "default";
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  const conversationItem = (
    <div className="flex items-center p-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  const messageItem = (isSender: boolean) => (
    <div className={`flex my-2 ${isSender ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
          isSender ? "bg-gray-300" : "bg-gray-200"
        }`}
      >
        <div className="h-4 bg-gray-300 rounded w-48"></div>
      </div>
    </div>
  );

  const messageThread = (
    <div className="p-4">
      {messageItem(false)}
      {messageItem(true)}
      {messageItem(false)}
      {messageItem(false)}
      {messageItem(true)}
    </div>
  );

  const renderSkeletons = () => {
    switch (type) {
      case "conversationList":
        return Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="animate-pulse">
              {conversationItem}
            </div>
          ));
      case "messageThread":
        return <div className="animate-pulse">{messageThread}</div>;
      default:
        return (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        );
    }
  };

  return <>{renderSkeletons()}</>;
};

export default SkeletonLoader;

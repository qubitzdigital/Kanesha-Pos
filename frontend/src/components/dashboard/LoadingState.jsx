import React from "react";
import AppLoader from "../common/AppLoader";

const LoadingState = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <AppLoader
        open
        variant="inline"
        title="Loading dashboard"
        subtitle="Preparing your latest overview"
      />
    </div>
  );
};

export default LoadingState;

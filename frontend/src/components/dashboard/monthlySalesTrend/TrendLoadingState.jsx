import React from "react";
import AppLoader from "../../common/AppLoader";

const TrendLoadingState = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <AppLoader
        open
        variant="inline"
        title="Loading sales trend"
        subtitle="Analyzing recent performance"
      />
    </div>
  );
};

export default TrendLoadingState;

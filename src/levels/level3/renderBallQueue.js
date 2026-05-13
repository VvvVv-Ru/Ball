function createBallElement(ball, headIndex, playfieldRect) {
  const ballElement = document.createElement("div");
  const diameter = ball.radius * 2;

  ballElement.className = "ball-queue-item";
  ballElement.dataset.ballId = ball.id;
  ballElement.dataset.ballOrder = `${ball.order}`;
  ballElement.dataset.colorKey = ball.colorKey;
  ballElement.dataset.isHead = `${ball.order === headIndex}`;
  ballElement.style.left = `${ball.position.x - playfieldRect.x - ball.radius}px`;
  ballElement.style.top = `${ball.position.y - playfieldRect.y - ball.radius}px`;
  ballElement.style.width = `${diameter}px`;
  ballElement.style.height = `${diameter}px`;
  ballElement.style.background = ball.colorHex;

  return ballElement;
}

export function renderLevel3BallQueue(ballQueueState, playfieldRect) {
  const ballQueueLayer = document.createElement("div");
  ballQueueLayer.className = "ball-queue-layer";

  if (!ballQueueState) {
    return {
      element: ballQueueLayer,
    };
  }

  ballQueueLayer.dataset.headIndex = `${ballQueueState.headIndex}`;
  ballQueueLayer.dataset.currentHeadColor = ballQueueState.currentHeadColor ?? "";

  ballQueueState.balls.forEach((ball) => {
    ballQueueLayer.appendChild(createBallElement(ball, ballQueueState.headIndex, playfieldRect));
  });

  return {
    element: ballQueueLayer,
  };
}

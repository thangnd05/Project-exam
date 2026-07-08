import { render, screen } from "@testing-library/react";

test("testing library renders a node", () => {
  render(<div>hello</div>);
  expect(screen.getByText("hello")).toBeInTheDocument();
});

import { render, screen } from "@testing-library/react";

// Smoke test kiểm tra toolchain test (Vitest + Testing Library + jsdom) hoạt động.
// Test "learn react" mặc định của CRA đã được thay vì không khớp app thực tế.
test("testing library renders a node", () => {
  render(<div>hello</div>);
  expect(screen.getByText("hello")).toBeInTheDocument();
});

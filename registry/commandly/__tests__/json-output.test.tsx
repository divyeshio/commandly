import { JsonOutput } from "../json-output";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
import { render, screen } from "@testing-library/react";
import { OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing";

describe("JsonOutput", () => {
  it("renders output type label", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<JsonOutput tool={defaultTool()} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?newTool=newTool",
        onUrlUpdate,
      }),
    });
    expect(screen.getByText(/Output type/)).toBeInTheDocument();
  });
});

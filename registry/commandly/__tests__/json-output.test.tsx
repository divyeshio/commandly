import { render, screen } from "@testing-library/react";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
import {
  OnUrlUpdateFunction,
  withNuqsTestingAdapter
} from "nuqs/adapters/testing";
import { JsonOutput } from "../json-output";

describe("JsonOutput", () => {
  it("renders output type label", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<JsonOutput tool={defaultTool()} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?newTool=newTool",
        onUrlUpdate
      })
    });
    expect(screen.getByText(/Output type/)).toBeInTheDocument();
  });
});

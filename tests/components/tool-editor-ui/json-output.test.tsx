import { render, screen } from "@testing-library/react";
import { JsonOutput } from "../../../src/tools/components/tool-editor-ui/json-output";
import { defaultTool } from "../../../src/tools/lib/utils/tool-editor";
import {
  OnUrlUpdateFunction,
  withNuqsTestingAdapter
} from "nuqs/adapters/testing";

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

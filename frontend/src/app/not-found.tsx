import BrandLink from "@/components/brand/BrandLink";
import SystemPage from "@/components/brand/SystemPage";

export default function NotFound() {
    return (
        <SystemPage mark="道" title="This page is not on the mat." body="The link you followed has moved, or the page never existed.">
            <BrandLink href="/">Back to the start</BrandLink>
            <BrandLink href="/find-a-dojo" variant="outline">Find a dojo</BrandLink>
        </SystemPage>
    );
}

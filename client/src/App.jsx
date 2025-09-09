import { Button } from "./components/ui/button";

function App() {
  return (
    <>
      <Button
        onClick={() => {
          console.log("Clicked!");
        }}
        className="bg-neutral-500"
      >
        Test Button
      </Button>
    </>
  );
}

export default App;

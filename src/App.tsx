import { useEffect } from "react";
import { Engine, Render, Bodies, Composite, Runner } from "matter-js";

function App() {
    useEffect(() => {
        // create an engine
        var engine = Engine.create();

        // create a renderer
        var render = Render.create({
            element: document.body,
            engine: engine,
        });

        // create two boxes and a ground
        var boxA = Bodies.rectangle(400, 200, 80, 80);
        var boxB = Bodies.rectangle(450, 50, 80, 80);
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

        // add all of the bodies to the world
        Composite.add(engine.world, [boxA, boxB, ground]);

        // run the renderer
        Render.run(render);

        // create runner
        var runner = Runner.create();

        // run the engine
        Runner.run(runner, engine);
    }, []);

    return <>Hello World</>;
}

export default App;

import { useEffect, useState } from "react";
import {
    Engine,
    Render,
    Bodies,
    Composite,
    Runner,
    Mouse,
    MouseConstraint,
    World,
    Events,
} from "matter-js";
import styled from "@emotion/styled";

const ContainerStyled = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    row-gap: 2rem;

    > h3 {
        color: #bbb;
    }
`;

const NavigationStyled = styled.ul`
    list-style: none;
    display: flex;
    column-gap: 1rem;
    text-align: center;

    > li {
        width: 30px;
        line-height: 30px;
        cursor: pointer;
        background-color: #eee;
    }
`;

const config = {
    SIZE: 500,
    BOX_SIZE: 30,
    BOX_GAP: 10,
};

function App() {
    const [engine, setEngine] = useState<Engine | null>(null);
    const [render, setRender] = useState<Render | null>(null);
    const [runner, setRunner] = useState<Runner | null>(null);

    function createRunner(engine: Engine) {
        const runner = Runner.create();
        setRunner(runner);

        Runner.run(runner, engine);
    }

    function createRender(engine: Engine, element: HTMLElement) {
        const { SIZE } = config;
        const render = Render.create({
            element,
            engine,
            options: {
                width: SIZE,
                height: SIZE,
                wireframes: false,
            },
        });
        setRender(render);
        Render.run(render);

        createRunner(engine);

        // 마우스 생성
        const $mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: $mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false,
                },
            },
        });
        World.add(engine.world, mouseConstraint);
    }

    function init() {
        if (!engine) {
            const engine = Engine.create();
            setEngine(engine);

            createRender(engine, document.getElementById("container")!);
        }
    }

    function drawNumbersOnBoxes() {
        const context = render!.context;

        Composite.allBodies(engine!.world).forEach((body) => {
            if (body.label && body.label.length === 1) {
                // 숫자인지 확인
                const position = body.position;
                context.font = "20px Arial";
                context.fillStyle = "#333";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(body.label, position.x, position.y + 1);
            }
        });
    }

    useEffect(() => {
        init();

        return () => {
            if (engine) {
                Engine.clear(engine);
            }
        };
    }, []);

    function handleStart() {
        Events.on(render, "afterRender", drawNumbersOnBoxes);
        const { SIZE, BOX_SIZE, BOX_GAP } = config;
        let startX = (SIZE - (BOX_SIZE * 10 + BOX_GAP * 9)) / 2;

        const numberBoxs = [];

        for (let i = 0; i < 10; i++) {
            const numberBox = Bodies.rectangle(
                startX,
                BOX_SIZE,
                BOX_SIZE,
                BOX_SIZE,
                {
                    isStatic: true,
                    render: {
                        fillStyle: "#bbb",
                        strokeStyle: "transparent",
                    },
                    label: i.toString(),
                },
            );

            startX += BOX_SIZE + BOX_GAP;

            numberBoxs.push(numberBox);
        }

        Composite.add(engine!.world, numberBoxs);
    }

    return (
        <ContainerStyled id="container">
            <h3 onClick={handleStart}>휴대폰번호를 입력해주세요.</h3>

            {/* <NavigationStyled>
                {Array.from({ length: 10 }, (_, index) => index).map(
                    (number) => (
                        <li>{number}</li>
                    ),
                )}
            </NavigationStyled> */}
        </ContainerStyled>
    );
}

export default App;

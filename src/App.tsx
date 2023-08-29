import { useEffect, useState, useRef } from "react";
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
    Vector,
    Query,
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
    DIAMOND_SIZE: 50,
};

function App() {
    const engine = useRef<Engine | null>(null);
    const render = useRef<Render | null>(null);
    const runner = useRef<Runner | null>(null);

    function createRunner() {
        if (engine.current) {
            runner.current = Runner.create();

            Runner.run(runner.current, engine.current);

            handleStart();
        }
    }
    function createRender(element: HTMLElement) {
        if (engine.current) {
            const { SIZE } = config;
            render.current = Render.create({
                element,
                engine: engine.current!,
                options: {
                    width: SIZE,
                    height: SIZE,
                    wireframes: false,
                    background: "transparent",
                },
            });
            Render.run(render.current);

            createRunner();

            // 마우스 생성
            const $mouse = Mouse.create(render.current.canvas);
            const mouseConstraint = MouseConstraint.create(engine.current, {
                mouse: $mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: false,
                    },
                },
            });

            World.add(engine.current.world, mouseConstraint);
            Events.on(mouseConstraint, "mousedown", handleBoxClick);
        }
    }
    function init() {
        if (!engine.current) {
            engine.current = Engine.create();

            createRender(document.getElementById("container")!);
        }
    }

    useEffect(() => {
        init();

        return () => {
            if (engine.current) {
                Engine.clear(engine.current);
            }
        };
    }, []);

    // Box에 숫자 그리기
    function drawNumbersOnBoxes() {
        if (engine.current && render.current) {
            const context = render.current.context;

            Composite.allBodies(engine.current.world).forEach((body) => {
                if (body.label && body.label.length === 1) {
                    // 숫자인지 확인
                    const position = body.position;
                    context.save(); // 현재의 캔버스 상태를 저장
                    context.translate(position.x, position.y); // 원의 중심으로 이동
                    context.rotate(body.angle); // 원이 회전한 각도로 캔버스 회전

                    context.font = "20px Arial";
                    context.fillStyle = "rgb(182, 182, 182)";
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillText(body.label, 0, 0); // 이제 원의 중심이 (0, 0)

                    context.restore(); // 캔버스 상태를 복원
                }
            });
        }
    }
    // Box 클릭 했을 때 숫자 드롭
    function dropNumber(number: string, position: Vector) {
        const { BOX_SIZE } = config;

        const fallingBox = Bodies.circle(
            position.x,
            position.y + BOX_SIZE * 2, // 박스 바로 아래에 생성
            8,
            {
                friction: 0.001,
                render: {
                    fillStyle: "transparent",
                },
                label: number,
            },
        );

        World.add(engine.current?.world!, fallingBox);
    }
    // Box Click EventListener
    function handleBoxClick(event: any) {
        const mousePosition = event.mouse.position;
        const bodiesUnderCursor = Query.point(
            Composite.allBodies(engine.current?.world!),
            mousePosition,
        );

        bodiesUnderCursor.forEach((body) => {
            if (body.label && body.label.length === 1) {
                // 숫자인지 확인
                dropNumber(body.label, body.position);
            }
        });
    }
    // Box 생성
    function addBoxes() {
        Events.on(render.current, "afterRender", drawNumbersOnBoxes);

        const { SIZE, BOX_SIZE, BOX_GAP } = config;
        let startX = (SIZE - (BOX_SIZE * 10 + BOX_GAP * 9)) / 2 + BOX_SIZE / 2;

        const numberBoxes = [];

        for (let i = 0; i < 10; i++) {
            const numberBox = Bodies.rectangle(
                startX,
                BOX_SIZE,
                BOX_SIZE,
                BOX_SIZE,
                {
                    isStatic: true,
                    render: {
                        fillStyle: "rgb(235, 235, 235)",
                        strokeStyle: "transparent",
                    },
                    label: i.toString(),
                },
            );

            startX += BOX_SIZE + BOX_GAP;

            numberBoxes.push(numberBox);
        }

        Composite.add(engine.current?.world!, numberBoxes);
    }

    function addDiamonds() {
        const { SIZE, DIAMOND_SIZE } = config;
        const BIG_DIAMOND_SIZE = DIAMOND_SIZE * 2;

        const left = Bodies.fromVertices(
            125,
            125,
            [
                [
                    { x: DIAMOND_SIZE, y: 0 },
                    { x: 0, y: DIAMOND_SIZE / 2 },
                    { x: DIAMOND_SIZE, y: DIAMOND_SIZE },
                    { x: DIAMOND_SIZE * 2, y: DIAMOND_SIZE / 2 },
                ],
            ],
            {
                isStatic: true,
                render: {
                    fillStyle: "rgb(235, 235, 235)",
                },
            },
        );

        const center = Bodies.fromVertices(
            SIZE / 2,
            200,
            [
                [
                    { x: BIG_DIAMOND_SIZE, y: 0 },
                    { x: 0, y: BIG_DIAMOND_SIZE / 2 },
                    { x: BIG_DIAMOND_SIZE, y: BIG_DIAMOND_SIZE },
                    { x: BIG_DIAMOND_SIZE * 2, y: BIG_DIAMOND_SIZE / 2 },
                ],
            ],
            {
                isStatic: true,
                render: {
                    fillStyle: "rgb(235, 235, 235)",
                },
            },
        );
        const right = Bodies.fromVertices(
            SIZE - 125,
            125,
            [
                [
                    { x: DIAMOND_SIZE, y: 0 },
                    { x: 0, y: DIAMOND_SIZE / 2 },
                    { x: DIAMOND_SIZE, y: DIAMOND_SIZE },
                    { x: DIAMOND_SIZE * 2, y: DIAMOND_SIZE / 2 },
                ],
            ],
            {
                isStatic: true,
                render: {
                    fillStyle: "rgb(235, 235, 235)",
                },
            },
        );

        World.add(engine.current?.world!, [left, center, right]);
    }

    function handleStart() {
        addBoxes();
        addDiamonds();
    }

    return (
        <ContainerStyled id="container">
            <h3>휴대폰번호를 입력해주세요.</h3>

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

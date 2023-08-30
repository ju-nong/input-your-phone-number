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
    Body,
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
    INPUT_SIZE: 20,
    INPUT_GAP: 5,
};

function App() {
    const engine = useRef<Engine | null>(null);
    const render = useRef<Render | null>(null);
    const runner = useRef<Runner | null>(null);

    const inputs = useRef<Body[]>([]);
    const moveRight = useRef(true);

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
                    height: SIZE + 200,
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
                    context.fillStyle = "rgb(76, 69, 69)";
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
                friction: 0.5,
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
    // Diamond 생성
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
    // Wall 생성
    function addWall() {
        const { SIZE } = config;
        const options = {
            isStatic: true,
            render: {
                fillStyle: "rgb(182, 182, 182)",
                strokeStyle: "transparent",
            },
        };

        const leftTop = Bodies.rectangle(2, 125, 4, 125, options);
        const leftMiddle = Bodies.rectangle(100, 250, 4, 250, {
            ...options,
            angle: -45,
        });
        const leftBottom = Bodies.rectangle(205, 365, 4, 100, options);

        const rightTop = Bodies.rectangle(SIZE - 2, 125, 4, 125, options);
        const rightMiddle = Bodies.rectangle(SIZE - 100, 250, 4, 250, {
            ...options,
            angle: 45,
        });
        const rightBottom = Bodies.rectangle(SIZE - 205, 365, 4, 100, options);

        World.add(engine.current?.world!, [
            leftTop,
            leftMiddle,
            leftBottom,
            rightTop,
            rightMiddle,
            rightBottom,
        ]);
    }
    // input 생성
    function addInputs() {
        const { SIZE, INPUT_SIZE, INPUT_GAP } = config;
        let startX =
            (SIZE - (INPUT_SIZE * 11 + INPUT_GAP * 10)) / 2 + INPUT_SIZE / 2;

        for (let i = 0; i < 11; i++) {
            const input = Bodies.rectangle(
                startX,
                SIZE,
                INPUT_SIZE,
                INPUT_SIZE,
                {
                    isStatic: true,
                    render: {
                        fillStyle: "rgb(182, 182, 182)",
                        strokeStyle: "transparent",
                    },
                    label: `input-${i}`,
                },
            );

            startX += INPUT_SIZE + INPUT_GAP;

            inputs.current.push(input);
        }

        World.add(engine.current?.world!, inputs.current);

        // Input 움직임
        Events.on(engine.current!, "afterUpdate", function () {
            const { INPUT_SIZE, SIZE } = config;

            const inputsLength = inputs.current.length;
            const [firstInput, endInput] = [
                inputs.current[0],
                inputs.current[inputsLength - 1],
            ];

            // 오른쪽 끝인지
            if (endInput.position.x > SIZE - INPUT_SIZE && moveRight.current) {
                moveRight.current = false;
            } else if (
                firstInput.position.x - INPUT_SIZE < 0 &&
                !moveRight.current
            ) {
                moveRight.current = true;
            }

            const x = moveRight.current ? 2 : -2;
            for (let i = 0; i < inputsLength; i++) {
                Body.translate(inputs.current[i], {
                    x,
                    y: 0,
                });
            }
        });

        // Input 충돌 감지
        Events.on(engine.current!, "collisionStart", function (event) {
            const { pairs } = event;

            for (let i = 0; i < pairs.length; i++) {
                const { bodyA, bodyB } = pairs[i];

                const [labelA, labelB] = [bodyA.label, bodyB.label];
                if (labelA.length === 1 && labelB.length === 1) {
                    // 이미 입력된 박스나, 숫자들끼리는 제외
                    return;
                }

                let [clashInput, clashNumber] = ["", ""];
                let removeNumber: null | Body = null;

                if (labelA.includes("input")) {
                    clashInput = labelA.split("-")[1];
                } else if (labelB.includes("input")) {
                    clashInput = labelB.split("-")[1];
                }

                if (labelA.length === 1) {
                    clashNumber = labelA;
                    removeNumber = bodyA;
                } else if (labelB.length === 1) {
                    clashNumber = labelB;
                    removeNumber = bodyB;
                }

                if (clashInput.length && clashNumber.length) {
                    const clashInputTarget = inputs.current[Number(clashInput)];
                    clashInputTarget.collisionFilter.mask = 0x000;
                    clashInputTarget.label = clashNumber;

                    World.remove(engine.current?.world!, removeNumber!);
                    Body.update(clashInputTarget, 1, 1, 1);
                }
            }
        });
    }

    function handleStart() {
        addBoxes();
        addDiamonds();
        addWall();
        addInputs();
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

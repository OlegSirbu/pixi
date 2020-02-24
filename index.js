/*
Softjourn VMT Code Test

Overview:
PIXI bunnies are spreading on Softjourn's green offices. Be the first to control them!

Controls:
[1] [Bunnies No.] <input type='number'> The amount of bunnies displayed. By changing this value a user should add/remove items.
[2] [Bunny Size] <input type='range'> Scale value of the selected items
[3] [Bunny Rotation] <input type='range'> Rotation value of the selected items

Task:
[1] Complete the <BunnyListInputs> component so the input values and the BunnyItems are updated.
[2] Implement multiple selection for bunnies when they are clicked.
[3] Implement controls [2] and [3] for the selected bunnies.

Notes:
* When items are added/removed, the remained items should keep their existing scale/rotation properties.
* When deselecting an item it should keep its existing properties.
* Nice to have, position() bunnies on multiple rows when first row gets filled.

Use of Codepen is not required, you can export the pen.
The task is expected in 2 days.
Good luck!!
*/

const CANVAS_ROOT = document.querySelector(".canvas-root");
const APP_ROOT = document.querySelector(".app-root");
const WIDTH_IMAGE = 50;
const EVENT_SCALE = "scale";
const EVENT_AMOUNT = "amount";
const EVENT_ROTATION = "rotation";
const START_POSITION = 10;
const BUNNY_SRC =
  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png";

class BunnyItem extends PIXI.Sprite {
  constructor(id) {
    super(PIXI.Texture.from(BUNNY_SRC));

    this.id = id;
  }

  position() {
    let index = this.parent.getChildIndex(this);
    const maxItemPerRow = parseInt(CANVAS_ROOT.clientWidth / WIDTH_IMAGE);

    this.x = START_POSITION + (index % maxItemPerRow) * WIDTH_IMAGE;
    this.y = START_POSITION + Math.floor(index / maxItemPerRow) * WIDTH_IMAGE;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }

  setScale(scale) {
    const perc = +scale / 1;
    this.scale.x = perc;
    this.scale.y = perc;
  }

  get selected() {
    return this._selected;
  }

  set selected(v) {
    this._selected = v;
  }
}

class CanvasApplication extends PIXI.Application {
  constructor() {
    super({
      width: CANVAS_ROOT.clientWidth,
      height: CANVAS_ROOT.clientHeight,
      transparent: true
    });
  }

  get bunnies() {
    return this.stage.children.filter(ch => ch instanceof BunnyItem);
  }

  addBunny(id, scale, rotation, onToggleBunny) {
    let bunny = new BunnyItem(id);
    this.stage.addChild(bunny);

    bunny.position();
    bunny.setRotation(rotation);
    bunny.setScale(scale);

    bunny.interactive = true;
    bunny.on("click", () => {
      onToggleBunny(id);
    });
    return bunny;
  }

  rotateBunny(id, value) {
    this.bunnies[id].rotation = value;
  }

  scaleBunny(id, perc) {
    const sBunny = this.bunnies[id] && this.bunnies[id].scale;
    sBunny.x = perc;
    sBunny.y = perc;
  }
}

class BunnyListInputs extends React.Component {
  constructor(props) {
    super();

    this.state = {
      items_selected: [],
      inputs: [
        {
          id: "amount",
          type: "number",
          value: 12,
          min: 1,
          max: 64,
          step: 1,
          label: "Bunnies No.",
          onChange: ev => this.onChangeAmount(ev.target.value)
        },
        {
          id: "scale",
          type: "range",
          value: 1.2,
          min: 1,
          max: 1.6,
          step: 0.1,
          label: "Bunny Size"
        },
        {
          id: "rotation",
          type: "range",
          value: 0,
          min: -1,
          max: 1,
          step: 0.1,
          label: "Bunny Rotation"
        }
      ]
    };

    this.onChange = this.onChange.bind(this);
    this.onToggleBunny = this.onToggleBunny.bind(this);
    this.getInputValues = this.getInputValues.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.renderBunny = this.renderBunny.bind(this);
  }

  componentDidMount() {
    const { amount, scale, rotation } = this.getInputValues();
    const { canvas } = this.props;
    new Array(amount).fill(0).map((bunny, id) => {
      canvas.addBunny(id, scale, rotation, this.onToggleBunny);
    });
  }

  getInputValues = (countOfBunny) => {
    const { inputs } = this.state;

    let amount = countOfBunny || inputs.find(input => input.id === EVENT_AMOUNT).value;
    let scale = inputs.find(input => input.id === EVENT_SCALE).value;
    let rotation = inputs.find(input => input.id === EVENT_ROTATION).value;

    return {
      amount,
      scale,
      rotation
    };
  };

  renderBunny = (countOfBunny) => {
    const { amount, scale, rotation } = this.getInputValues(countOfBunny);
    const { canvas } = this.props;
    const { bunnies } = canvas;
    const bunniesLength = bunnies.length;

    // if have some bunnies start working with it
    if (bunniesLength > 0) {
      // check
      if (bunniesLength > amount) {
        // need to destroy bunnies
        console.log(amount, bunniesLength, bunnies
          .slice(amount, bunniesLength))
          bunnies.slice(amount, bunniesLength).forEach(b => b.destroy());
      } else {
        // need to add more bunnies
        [
          ...bunnies,
          ...Array.from({ length: amount - bunniesLength }).map((v, id) =>
            canvas.addBunny(
              bunnies.length + id,
              scale,
              rotation,
              this.onToggleBunny
            )
          )
        ];
      }
    }
  };

  onToggleBunny(id) {
    const { items_selected } = this.state;

    this.setState({
      items_selected: items_selected.includes(id)
        ? items_selected.filter(v => v !== id)
        : [...items_selected, id]
    });
  }

  onChangeAmount(value) {
    let inputs = [...this.state.inputs].map(input => {
      if (input.id === EVENT_AMOUNT) {
        input.value = Number(value);
        input.value <= input.max && this.renderBunny(input.value);
      }
      return input;
    });

    this.setState({
      ...this.state,
      items_selected: [], // clear all selected items
      inputs
    });
  }

  onChange(id, value) {
    this.setState(
      {
        inputs: this.state.inputs.map(input => {
          // merge inputs
          if (input.id === id) {
            return {
              ...input,
              value: +value
            };
          }
          return input;
        })
      },
      () => {
        // check if have some selected items
        if (this.state.items_selected.length > 0) {
          const { canvas } = this.props;
          const { items_selected } = this.state;

          if (id === EVENT_SCALE) {
            // need to scale all selected bunnies
            const perc = +value / 1;
            items_selected.forEach(id => {
              canvas.scaleBunny(id, perc);
            });
          } else {
            // need to rotate all selected bunnies
            items_selected.forEach(id => {
              canvas.rotateBunny(id, +value);
            });
          }
        }
      }
    );
  }

  renderInput(input) {
    let onChange = input.onChange
      ? input.onChange // when a custom handler prop if exists
      : ev => this.onChange(input.id, ev.target.value); // else use the generic onChange handler

    return (
      <div id={`bunny-input-${input.id}`}>
        <label for={input.id}>{input.label}</label>
        <input {...input} onChange={onChange} />
      </div>
    );
  }

  render() {
    let inputs = this.state.inputs;
    let items_selected = this.state.items_selected;

    return (
      <div className="bunny-inputs">
        {inputs.map(input => this.renderInput(input))}
        <label>Selected Bunnies: {items_selected.length}</label>
      </div>
    );
  }
}

class App extends React.Component {
  constructor() {
    super();

    this.canvas = new CanvasApplication();
    CANVAS_ROOT.appendChild(this.canvas.view);
  }

  render() {
    if (!this.canvas) return;

    return <BunnyListInputs canvas={this.canvas} />;
  }
}
ReactDOM.render(<App />, APP_ROOT);

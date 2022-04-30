import { Application } from "@hotwired/stimulus";
import HelloController from "./controllers/hello_controller";

const Stimulus = Application.start();
Stimulus.register("hello", HelloController);

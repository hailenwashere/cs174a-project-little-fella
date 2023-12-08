import {defs, tiny} from './examples/common.js';
import { Shape_From_File } from './examples/obj-file-demo.js';
import { Body, Simulation, Collision_Demo } from './examples/collisions-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;
const { Tetrahedron, Textured_Phong } = defs;

export class Project extends Scene{
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.background_music = new Audio("assets/animal-crossing-theme-song.mp3");

        this.body_tree_collision = false;
        this.continue_animation_post_collision = false;

        this.get_start_time_once = false;
        this.start_ouch_time;

        this.apple_dropping = false;
        this.drop_time = 1000000000;

        // for collision
        this.colliders = [
            {intersect_test: Body.intersect_cube, points: new defs.Cube(), leeway: .05}
        ];

        this.collider_selection = 0;

        this.trunk_location;
        this.little_fella_body_location;

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15,15),
            torus2: new defs.Torus(3,15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1,15),
            tetrahedron: new Tetrahedron(1),
            axes: new defs.Axis_Arrows(),
            cube: new defs.Cube(),
            trunk: new defs.Capped_Cylinder(15, 15),

            s1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            s2: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            s3: new defs.Subdivision_Sphere(3),
            s4: new defs.Subdivision_Sphere(4),

            ocean: new defs.Cube(),
            ground: new defs.Capped_Cylinder(1, 12),
            seashell: new Shape_From_File("assets/seashell.obj"),
            grass: new Shape_From_File("assets/grass.obj"),
            palmtree: new Shape_From_File("assets/palmtree3.obj"),
            specialtree: new Shape_From_File("assets/tree.obj"),
        };

        this.shapes.ocean.arrays.texture_coord = this.shapes.ocean.arrays.texture_coord.map(x => x.times(5));
        this.ocean_transform = Mat4.identity().times(Mat4.scale(50, .1, 50)).times(Mat4.translation(0, -17, 0, 0));

        // *** Materials
        this.materials = {
            introScreen: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/intro-screen.jpg")
            }),
            skin: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ffdbac")}),
            pants: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 0, color: hex_color("#687796")}),
            shirt: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ff0000")}),
            tree: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.6, specularity: 0.1, color: hex_color("#4F7942")}),
            trunk: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.6, specularity: 0.1, color: hex_color("#80461B")}),
            apple: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.6, color: hex_color("#FF0000")}),
            rock: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.2, color: hex_color("#888c8d")}),
            grass: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                specularity: 0,
                texture: new Texture("assets/grass.png")
            }),
            sand: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                specularity: 0,
                texture: new Texture("assets/sand.jpeg")
            }),
            shell: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/shell.png")
            }),
            water: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 0.9,
                texture: new Texture("assets/water.jpg", "LINEAR_MIPMAP_LINEAR")
            }),
            sky: new Material(new defs.Textured_Phong(), {
                ambient: 0.55,
                color: hex_color("#87CEFA"),
                texture: new Texture("assets/sky.png")
            }),
            palmtree: new Material(new defs.Textured_Phong(), {
                ambient: 1,
                color: hex_color("#000000"),
                texture: new Texture("assets/Low Poly Palm Tree Render for Youtube.mtl")
            }),
            ouch: new Material(new defs.Textured_Phong(), {
                ambient: 1,
                color: hex_color("#000000"),
                texture: new Texture("assets/ouch.jpg")
            }),
            palmtree: new Material(new defs.Textured_Phong(), {
                ambient: 1,
                color: hex_color("#000000"),
                texture: new Texture("assets/Low Poly Palm Tree Render for Youtube.mtl")
            })
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.top_camera_location = Mat4.look_at(vec3(0, 20, 10), vec3(0, 0, 0), vec3(0, 1, 0));
        this.bottom_camera_location = Mat4.look_at(vec3(0, 1, 10), vec3(0, 0, 0), vec3(0, 1, 0));
        this.camerasettings = 0; // cannot exceed 1 or -1, 1 for top, 0 for middle, -1
    }

    make_control_panel() {
        this.key_triggered_button("Drop apple", ["0"], () => {this.apple_dropping = true; this.drop_time = animation_time / 1000.0;});
        this.new_line();
        this.key_triggered_button("Diagonal view", ["Control", "1"], () => this.attached = () => this.diagonal_view);
        this.new_line();
        this.key_triggered_button("Front view", ["Control", "2"], () => this.attached = () => this.bottom_view);
        this.new_line();
        this.key_triggered_button("Top view",  ["Control", "3"], () => this.attached = () => this.top_view);
    }

    draw_little_fella(context, program_state) {
        var model_transform = Mat4.identity();

        let t = program_state.animation_time / 1000.0;
        let swayAngle = (0.1 * Math.PI);
        swayAngle = ((swayAngle/2) + ((swayAngle/2) * Math.sin(((2 * Math.PI) / 3) * t)));

        // how to stop movement after a certain time
        // if (t >= 14) {
        //     swayAngle = 0;
        // }

        // axes for reference
        //this.shapes.axes.draw(context, program_state, model_transform, this.materials.test);  // for reference

        // draw head
        var head_transform = model_transform.times(Mat4.scale(1.2, 1.05, 1)).times(Mat4.scale(-0.4, -0.4, -0.4)).times(Mat4.translation(0, -2, 0));

        // x and z coordinates to return to camera matrix
        var ret_x_transform = 0;
        var ret_z_transform = 0;

        // rotate little fella head
        if (t >= 5 && t < 6) {
            head_transform = head_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 6 && t < 10) {
            head_transform = head_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0));
        }
        else if (t >= 10 && t < 17) { //&& t < 14
            // if time was x coord and x-pos was y coord, we want to go from (10, 0) to (14, 3.1) --> slope is 0.775
            var x_transform = 0.7625 * t - (0.7625 * 10);
            ret_x_transform = x_transform;
            // want to go from (10, 0) to (14, -6.4) --> slope is -1.6
            var z_transform = -1.6 * t - (-1.6 * 10);
            ret_z_transform = z_transform;

            if (this.body_tree_collision) {
                head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(3.09, 0, -3.6)); // x coord was 3.05
                this.continue_animation_post_collision = true;
            }
            else if(this.continue_animation_post_collision) {

            }
            else {
                head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(x_transform, 0, z_transform));
            }
        }
        else if (t >= 17 && t < 18) {
            head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(3.09, 0, -3.6));  // z coord was -5.6
            head_transform = head_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 18 && t < 18.5) {
            head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(3.09, 0, -3.6)).times(Mat4.rotation(18 * 1.5, 0, 1, 0));
        }
        else if (t >= 18.5 && t < 25.5) {
            var x_transform = 0.1857 * t - (0.1857 * 18.5);
            ret_x_transform = x_transform;  
            var y_transform = 0.1428 * t - (0.1428 * 18.5);
            var z_transform = -7.1285 * t - (-7.1285 * 18.5);
            ret_z_transform = z_transform;
            head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(3.09, 0, -3.6)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(x_transform, y_transform, z_transform));
        }
        else if (t >= 25.5) {
            head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(3.09, 0, -3.6)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(1.3, 1, -49.9));
        }
        this.shapes.s3.draw(context, program_state, head_transform, this.materials.skin);

        // draw body
        var body_transform = model_transform.times(Mat4.scale(0.4, 0.5, 0.4));
        if (t >= 5 && t < 6) {
            body_transform = body_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 6 && t < 10) {
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0));
        }
        else if (t >= 10 && t < 17) {  //&& t < 14
            var x_transform = -1 * t - (-1 * 10);
            var z_transform = 1.75 * t - (1.75 * 10);
            // little fella jumps backs after collision
            if (this.body_tree_collision) {
                if (!this.get_start_time_once) {
                    this.start_ouch_time = t;
                    this.get_start_time_once = true;
                }
                
                body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-4, 0, 4));  // z coord used to be 6
                this.continue_animation_post_collision = true;
            }
            // after collision movement
            else if (this.continue_animation_post_collision) {

            }
            // before collision movement
            else {
                body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(x_transform, 0, z_transform));
            }
        }
        else if (t >= 17 && t < 18) {
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-4, 0, 4));
            body_transform = body_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 18 && t < 18.5) {
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-4, 0, 4)).times(Mat4.rotation(18 * 1.5, 0, 1, 0));
        }
        else if (t >= 18.5 && t < 25.5) {
            var y_transform = -0.1142 * t - (-0.1142 * 18.5);
            var z_transform = 8.5714 * t - (8.5714 * 18.5);
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-4, 0, 4)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(0, y_transform, z_transform));
        }
        else if (t >= 25.5) {
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-4, 0, 4)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -0.8, 60));
        }
        this.shapes.cube.draw(context, program_state, body_transform, this.materials.shirt);
        this.little_fella_body_location = body_transform; // might have to move this code to the spot the body is in when it hits the tree

        // draw legs
        var left_leg_transform = model_transform.times(Mat4.scale(0.1, 0.3, 0.1)).times(Mat4.translation(-1.9, -2, 0));
        if (t >= 5 && t < 6) {
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0));
        }
        else if (t >= 6 && t < 10) {
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0));
        }
        else if (t >= 10 && t < 17) { //&& t < 14
            var x_transform = -4 * t - (-4 * 10);
            var z_transform = 7 * t - (7 * 10);
            if (this.body_tree_collision) {
                left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-16, 0, 16));
                this.continue_animation_post_collision = true;
            }
            else if (this.continue_animation_post_collision) {

            }
            else {
                left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(x_transform, 0, z_transform)).times(Mat4.rotation(swayAngle, 1, 0, 0));
            }
        }
        else if (t >= 17 && t < 18) {
            // left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20));  // FIX Rotation is wack
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-16, 0, 16));
            left_leg_transform = left_leg_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 18 && t < 18.5) {
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20));
        }
        else if (t >= 18.5 && t < 25.5) {
            var y_transform = -0.2857 * t - (-0.2857 * 18.5);
            var z_transform = 34.285 * t - (34.285 * 18.5);
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20)).times(Mat4.translation(0, y_transform, z_transform)).times(Mat4.rotation(swayAngle, 1, 0, 0));
        }
        else if (t >= 25.5) {
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20)).times(Mat4.translation(0, -2, 240));
        }

        var right_leg_tranform = model_transform.times(Mat4.scale(0.1, 0.3, 0.1)).times(Mat4.translation(1.9, -2, 0));
        if (t >= 5 && t < 6) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0));
        }
        else if (t >= 6 && t < 10) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0));
        } 
        else if (t >= 10 && t < 17) {
            var x_transform = -4 * t - (-4 * 10);
            var z_transform = 7 * t - (7 * 10);
            if (this.body_tree_collision) {
                right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-16, 0, 16));
                this.continue_animation_post_collision = true;
            }
            else if (this.continue_animation_post_collision) {

            }
            else {
                right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(x_transform, 0, z_transform)).times(Mat4.rotation(-swayAngle, 1, 0, 0));
            }
        }
        else if (t >= 17 && t < 18) {
            // right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20)); // FIX Rotation is wack
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-16, 0, 16));
            right_leg_tranform = right_leg_tranform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 18 && t < 18.5) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20));
        }
        else if (t >= 18.5 && t < 25.5) {
            var y_transform = -0.2857 * t - (-0.2857 * 18.5);
            var z_transform = 34.285 * t - (34.285 * 18.5);
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20)).times(Mat4.translation(0, y_transform, z_transform)).times(Mat4.rotation(-swayAngle, 1, 0, 0));
        }
        else if (t >= 25.5) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-10.5, 0, -20)).times(Mat4.translation(0, -2, 240));
        }
        this.shapes.cube.draw(context, program_state, left_leg_transform, this.materials.skin);
        this.shapes.cube.draw(context, program_state, right_leg_tranform, this.materials.skin);

        // draw arms
        var left_arm_transform = model_transform.times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0));
        if (t >= 5 && t < 6) {
            left_arm_transform = model_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0));
        }
        else if (t >= 6 && t < 10) {
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0));
        }
        else if (t >= 10 && t < 17) { // && t < 14
            var x_transform = -0.8 * t - (-0.8 * 10);
            var z_transform = 7 * t - (7 * 10);
            if (this.body_tree_collision) {
                left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-3.2, 0, 16));
                this.continue_animation_post_collision = true;
            }
            else if (this.continue_animation_post_collision) {

            }
            else {
                left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(x_transform, 0, z_transform));
            }
        }
        else if (t >= 17 && t < 18) {
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-3.2, 0, 16)).times(Mat4.rotation(t, 0, 1, 0));
            // left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-2, 0, -19.7)); //FIX! Rotation is wonky   
        }
        else if (t >= 18 && t < 18.5) {
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-2, 0, -19.7));
        }
        else if (t >= 18.5 && t < 25.5) {
            var y_transform = -0.5357 * t - (-0.5357 * 18.5);
            var z_transform = 34.2857 * t - (34.2857 * 18.5);
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-2, 0, -19.7)).times(Mat4.translation(0, y_transform, z_transform));
        }
        else if (t >= 25.5) {
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-2, 0, -19.7)).times(Mat4.translation(0, -3.7, 240));
        }
        var right_arm_tranform = left_arm_transform.times(Mat4.translation(1.4, 0, 0));
        this.shapes.cube.draw(context, program_state, left_arm_transform, this.materials.skin);
        this.shapes.cube.draw(context, program_state, right_arm_tranform, this.materials.skin);

        // draw hands
        var left_hand_transform = model_transform.times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0));
        if (t >= 5 && t < 6) {
            left_hand_transform = model_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0));
        }
        else if (t >= 6 && t < 10) {
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0));
        }
        else if (t >= 10 && t < 17) {
            var x_transform = -2 * t - (-2 * 10);
            var z_transform = 3.5 * t - (3.5 * 10);
            if (this.body_tree_collision) {
                left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0)).times(Mat4.translation(-8, 0, 8));
                this.continue_animation_post_collision = true;
            }
            else if (this.continue_animation_post_collision) {

            }
            else {
                left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0)).times(Mat4.translation(x_transform, 0, z_transform));
            }
        }
        else if (t >= 17 && t < 18) {
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0)).times(Mat4.translation(-8, 0, 8)).times(Mat4.translation(4.8, -0.4, 5)).times(Mat4.rotation(t * 1.5, 0, 1, 0));
            // left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.rotation(t * 1.5, 0, 1, 0)); //  FIX Rotation is wonky
        }
        else if (t >= 18 && t < 18.5) {
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-10, 0.4, -10)); 
        }
        else if (t >= 18.5 && t < 25.5) {
            var y_transform = -0.2857 * t - (-0.2857 * 18.5);
            var z_transform = 17.1428 * t - (17.1428 * 18.5);
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-10, 0.4, -10)).times(Mat4.translation(0, y_transform, z_transform)); 
        }
        else if (t >= 25.5) {
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.rotation(18 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-10, 0.4, -10)).times(Mat4.translation(0, -2, 120)); 
        }
        var right_hand_transform = left_hand_transform.times(Mat4.translation(9.6, 0, 0));
        this.shapes.s4.draw(context, program_state, left_hand_transform, this.materials.skin);
        this.shapes.s4.draw(context, program_state, right_hand_transform, this.materials.skin);

        return [ret_x_transform, ret_z_transform];
    }

    draw_tree(context, program_state) {
        // add index parameter later for multiple
        var top_transform = Mat4.identity().times(Mat4.scale(.6, .6, .6)).times(Mat4.translation(4.8, 4.5, -4)); // 4.8, 1.7, 2
        var left_transform = Mat4.identity().times(Mat4.scale(.6, .6, .6)).times(Mat4.translation(4, 3.2, -4));  //4, 0.4, 2
        var right_transform = Mat4.identity().times(Mat4.scale(.6, .6, .6)).times(Mat4.translation(5.6, 3.2, -4)); //5.6, 0.4, 2
        var trunk_transform = Mat4.identity().times(Mat4.rotation(.5 * Math.PI, 1, 0, 0)).times(Mat4.scale(0.4, 0.4, 2.5)).times(Mat4.translation(7, -6, -0.1));  //original translation 7, 3, 0.8    original scale 0.4, 0.4, 1.1

        // this.shapes.tree.draw(context, program_state, Mat4.identity(), this.materials.trunk);
        this.shapes.sphere.draw(context, program_state, top_transform, this.materials.tree);
        this.shapes.sphere.draw(context, program_state, left_transform, this.materials.tree);
        this.shapes.sphere.draw(context, program_state, right_transform, this.materials.tree);
        this.shapes.trunk.draw(context, program_state, trunk_transform, this.materials.trunk);
        this.trunk_location = trunk_transform;

        let t = program_state.animation_time / 1000.0;
        var apple_transform;
        if (this.apple_dropping) {
            apple_transform = apple_transform.times(Mat4.translation(0, 0, -1 * (t - this.drop_time)));
        } else apple_transform = Mat4.identity().times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(12, 9, -9));  // original translation 12, 6, 8
        this.shapes.sphere.draw(context, program_state, apple_transform, this.materials.apple);

        // for apple falling on the ground, can use Inertia_Demo (unser assets/collisions-demo.js) for inspo)

    }

    draw_cloud(context, program_state, x = 0, y = 0, start = 0, scale = 1) {
        let t = program_state.animation_time / 1000;

        let cloud_transform = Mat4.identity().times(Mat4.rotation(t/60 + start, 0, 1, 0)).times(Mat4.translation(x, y, 0));
        cloud_transform = cloud_transform.times(Mat4.rotation(-Math.PI/2, 0, 1, 0)).times(Mat4.scale(scale, scale, scale));

        let cloud1_transform = cloud_transform.times(Mat4.scale(3, 2, 2));
        let cloud2_transform = cloud_transform.times(Mat4.scale(2, 1.5, 1.5)).times(Mat4.translation(1.5, 0, 0));
        let cloud3_transform = cloud_transform.times(Mat4.scale(2, 1.5, 1)).times(Mat4.translation(-1.5, -0.5, 1));
        let cloud4_transform = cloud_transform.times(Mat4.scale(1.5, 1.2, 1)).times(Mat4.translation(1.5, -1, 1));
        let cloud5_transform = cloud_transform.times(Mat4.scale(1.7, 1.2, 1)).times(Mat4.translation(-1.75, 0.5, .7));
        let cloud6_transform = cloud_transform.times(Mat4.scale(1.5, 1, 1)).times(Mat4.translation(-3, 0, 1));

        this.shapes.s2.draw(context, program_state, cloud1_transform, this.materials.cloud);
        this.shapes.s2.draw(context, program_state, cloud2_transform, this.materials.cloud);
        this.shapes.s2.draw(context, program_state, cloud3_transform, this.materials.cloud);
        this.shapes.s2.draw(context, program_state, cloud4_transform, this.materials.cloud);
        this.shapes.s2.draw(context, program_state, cloud5_transform, this.materials.cloud);
        this.shapes.s2.draw(context, program_state, cloud6_transform, this.materials.cloud);
    }

    draw_sky(context, program_state) {
        var sky_transform = Mat4.identity().times(Mat4.scale(50, 50, 50));
        this.shapes.sphere.draw(context, program_state, sky_transform, this.materials.sky);

        this.draw_cloud(context, program_state, 49, 5, 10);
        this.draw_cloud(context, program_state, 49, 7, 15, 0.75);
        this.draw_cloud(context, program_state, 49, 7);
        this.draw_cloud(context, program_state, 49, 6, 20);
        this.draw_cloud(context, program_state, 49, 12, 2, 0.9);

        this.draw_cloud(context, program_state, 47, 10, 5, 0.75);
        this.draw_cloud(context, program_state, 47, 12, 22, 0.8);
        this.draw_cloud(context, program_state, 47, 12, 43, 0.6);
        this.draw_cloud(context, program_state, 47, 12, 14, 0.6);

        this.draw_cloud(context, program_state, 45, 15, 25);
        this.draw_cloud(context, program_state, 45, 20, 30, 0.6);
        this.draw_cloud(context, program_state, 45, 13, 35, 0.8);
        this.draw_cloud(context, program_state, 45, 17, 11, 0.6);
        this.draw_cloud(context, program_state, 45, 16, 20, 0.8);
    }


    draw_ground(context, program_state) {
        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let ocean_rotate = Math.PI / 90 * dt;
        this.ocean_transform = this.ocean_transform.times(Mat4.rotation(ocean_rotate, 0, 0, 1));
        this.shapes.ocean.draw(context, program_state, this.ocean_transform, this.materials.water);

        let sand_transform = Mat4.identity().times(Mat4.rotation(.5 * Math.PI, 1, 0, 0)).times(Mat4.scale(25, 30, .4)).times(Mat4.translation(0, 0, 4));
        this.shapes.ground.draw(context, program_state, sand_transform, this.materials.sand);

        let grass_transform = Mat4.identity().times(Mat4.rotation(.5 * Math.PI, 1, 0, 0)).times(Mat4.scale(20, 25, .5)).times(Mat4.translation(0, 0, 2.5));
        this.shapes.ground.draw(context, program_state, grass_transform, this.materials.grass);

        let shoreL_transform = grass_transform.times(Mat4.scale(.4, .3, 1)).times(Mat4.translation(-3, -2.5, 0));
        let shoreS_transform = shoreL_transform.times(Mat4.scale(.6, .5, 1)).times(Mat4.translation(1.5, -1.5, 0));
        this.shapes.s2.draw(context, program_state, shoreL_transform, this.materials.rock);
        this.shapes.s2.draw(context, program_state, shoreS_transform, this.materials.rock);

        let rockS_transform = Mat4.identity().times(Mat4.scale(.5, .5, .6));
        let rockL_transform = Mat4.identity().times(Mat4.scale(.6, .6, .7));
        this.shapes.s2.draw(context, program_state, rockS_transform.times(Mat4.translation(1, -2, 35)), this.materials.rock);
        this.shapes.s2.draw(context, program_state, rockL_transform.times(Mat4.translation(0, -1.5, 30)), this.materials.rock);
        this.shapes.s2.draw(context, program_state, rockS_transform.times(Mat4.translation(-10, -2, -10)), this.materials.rock);
        this.shapes.s2.draw(context, program_state, rockL_transform.times(Mat4.translation(-8.5, -1.5, -7)), this.materials.rock);

        let blade_transform = Mat4.identity().times(Mat4.scale(.4, .4, .4));
        this.shapes.grass.draw(context, program_state, blade_transform.times(Mat4.translation(30, -2.5, 10)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, blade_transform.times(Mat4.translation(-30, -2.5, 20)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, blade_transform.times(Mat4.translation(40, -2.5, 20)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, blade_transform.times(Mat4.translation(-40, -2.5, 20)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, blade_transform.times(Mat4.translation(10, -2.5, 35)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, blade_transform.times(Mat4.translation(-10, -2.5, 45)), this.materials.grass);

        let seashell_transform = Mat4.identity().times(Mat4.scale(.3, .3, .3));
        this.shapes.seashell.draw(context, program_state, seashell_transform.times(Mat4.translation(70, -4.4, 10)), this.materials.shell);
        this.shapes.seashell.draw(context, program_state, seashell_transform.times(Mat4.translation(70, -4.4, 20)), this.materials.shell);
        this.shapes.seashell.draw(context, program_state, seashell_transform.times(Mat4.translation(-70, -4.4, -12)), this.materials.shell);
        this.shapes.seashell.draw(context, program_state, seashell_transform.times(Mat4.translation(-30, -4.4, -80)), this.materials.shell);
        this.shapes.seashell.draw(context, program_state, seashell_transform.times(Mat4.translation(32, -4.4, 80)), this.materials.shell);
    }

    draw_palmtrees(context, program_state) {
        let palmtree_transform = Mat4.identity().times(Mat4.scale(1.5, 1.5, 1.5)).times(Mat4.translation(0, 1.8, 0));
        this.shapes.palmtree.draw(context, program_state, palmtree_transform.times(Mat4.translation(0, 0, -17)), this.materials.tree);
        this.shapes.palmtree.draw(context, program_state, palmtree_transform.times(Mat4.translation(-14, 0, 2)), this.materials.tree);
        this.shapes.palmtree.draw(context, program_state, palmtree_transform.times(Mat4.translation(13, 0, 6)), this.materials.tree);
    }

    draw_specialtree(context, program_state) {
        let tree_transform = Mat4.identity().times(Mat4.translation(0, 0.9, 0));
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(-5, 0, 3)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.rotation(1.5, 0, 1, 0).times(Mat4.translation(7, 0, -2))), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(0, -3, 0)).times(Mat4.rotation(-0.8, 0, 1, 0)).times(Mat4.translation(0, 3, 0)).times(Mat4.translation(7, 0, -2)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.rotation(1.5, 0, 1, 0).times(Mat4.translation(7, 0, -2))), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.rotation(3.7, 0, 1, 0).times(Mat4.translation(-7, 0, 5))), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.rotation(8, 0, 1, 0).times(Mat4.translation(15, 0, -5))), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(14, 0, 11)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(14, 0, -6)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(-14, 0, -8)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(-15, 0, 9)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(-6, 0, 14)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(3, 0, 13)), this.materials.tree);
        this.shapes.specialtree.draw(context, program_state, tree_transform.times(Mat4.translation(8, 0, 14)), this.materials.tree);
    }

    draw_ouch(context, program_state) {
        let t = program_state.animation_time / 1000;
        if (this.body_tree_collision) {
            let ouch_transform = Mat4.identity().times(Mat4.scale(1, 1, 0.1)).times(Mat4.translation(0.3, 3, -4));
            if (t >= this.start_ouch_time + 2) {
                // ouch emote will not be drawn anymore
            }
            else {
                this.shapes.cube.draw(context, program_state, ouch_transform, this.materials.ouch);
            }
        }
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.

        // play background music -- won't loop yet though
        this.background_music.play();

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, -5, -40))
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // lighting of sun
        const light_position = vec4(-5, 10, 7, 1);  //light position at center of sun sphere
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];


        const [head_x, head_z] = this.draw_little_fella(context, program_state);

        this.draw_tree(context, program_state);

        this.draw_ground(context, program_state);

        this.draw_palmtrees(context, program_state);

        this.draw_specialtree(context, program_state);

        this.draw_ouch(context, program_state);

        var bodies = new Array();
        bodies.push(new Body(this.shapes.trunk, this.materials.trunk, vec3(1, 1 + Math.random())).emplace(this.trunk_location, 0, 0));
        bodies.push(new Body(this.shapes.cube, this.materials.shirt, vec3(1, 1 + Math.random())).emplace(this.little_fella_body_location, 0, 0));
        // *** This draws the colliding outline around the tree trunk and little fella body -- not necessary ***
        // const {points, leeway} = this.colliders[this.collider_selection];
        // const size = vec3(1 + leeway, 1 + leeway, 1 + leeway);
        // for (let b of bodies) {
        //     // bodies[b] is a Body object
        //     points.draw(context, program_state, b.drawn_location.times(Mat4.scale(...size)), this.materials.skin, "LINE_STRIP");
        // }

        // *** This implements collision detection ***
        const collider = this.colliders[this.collider_selection];
        // Loop through all bodies (call each "a"):
        for (let a of bodies) {
            // Cache the inverse of matrix of body "a" to save time.
            a.inverse = Mat4.inverse(a.drawn_location);
            a.material = this.materials.skin;
            // *** Collision process is here ***
            // Loop through all bodies again (call each "b"):
            for (let b of bodies) {
                // Pass the two bodies and the collision shape to check_if_colliding():
                if (!a.check_if_colliding(b, collider))
                    continue;
                // If we get here, we collided
                // console.log("Colliding");
                a.material = this.materials.shirt; // not seeing this happen
                this.body_tree_collision = true;
            }
        }

        // add in a sky (sphere)
        var sky_transform = Mat4.identity();
        sky_transform = sky_transform.times(Mat4.scale(50, 50, 50))
        this.shapes.sphere.draw(context, program_state, sky_transform, this.materials.sky);

        this.diagonal_view = Mat4.look_at(vec3(0, 10, 20), vec3(head_x, 0, head_z), vec3(0, 1, 0));
        this.top_view = Mat4.look_at(vec3(0, 20, 10), vec3(head_x, 0, head_z), vec3(0, 1, 0));
        this.bottom_view = Mat4.look_at(vec3(0, 1, 10), vec3(head_x, 0, head_z), vec3(0, 1, 0));

        if (this.attached != undefined) {
            program_state.camera_inverse = this.attached().map((x, i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        }

    }
}

class Gouraud_Shader extends Shader {
    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;

        // ***** PHONG SHADING HAPPENS HERE: *****
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the
                // light will appear directional (uniform direction from all points), and we
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to
                // the point light's location from the current surface point.  In either case,
                // fade (attenuate) the light as the vector needed to reach it gets longer.
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz -
                                               light_positions_or_vectors[i].w * vertex_worldspace;
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );

                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;
            // Position is expressed in object coordinates.

            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;

            void main(){
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                //add the below to make sure color calculation occurs in vertex shader
                vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                vertex_color.xyz += phong_model_lights(N, vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){
                // Compute an initial (ambient) color:
                //gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                //gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );

                //now that color calculations happen in vertex_glsl_code, don't do it here
                gl_FragColor = vertex_color;
                return;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Texture_Scroll_X extends Textured_Phong {
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // translate the texture varying the s coordinate by 2 texture units/sec
                float slide_trans = mod(animation_time, 4.) * 2.; 
                mat4 slide_matrix = mat4( vec4(-1., 0., 0., 0.), 
                                          vec4( 0., 1., 0., 0.), 
                                          vec4( 0., 0., 1., 0.),
                                          vec4(slide_trans, 0., 0., 1.)); 

                vec4 new_tex_coord = vec4(f_tex_coord, 0, 0) + vec4(1., 1., 0., 1.); 
                new_tex_coord = slide_matrix * new_tex_coord; 
                vec4 tex_color = texture2D(texture, new_tex_coord.xy);
               
                if( tex_color.w < .01 ) discard;

                // compute initial (ambient) color
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 

                // compute final color with light contributions
                // gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );  
        } `;
    }
}
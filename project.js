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
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            tetrahedron: new Tetrahedron(1),
            axes: new defs.Axis_Arrows(),
            cube: new defs.Cube(),
            trunk: new defs.Capped_Cylinder(15, 15),
            tree: new Shape_From_File("assets/tree.obj"),
            palm_tree: new Shape_From_File("assets/palmtree.obj"),
            //teapot: new Shape_From_File("assets/teapot.obj"),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            // instantiate 4 spheres with 1, 2, 3, 4 for the number of subdivision
            // for instances with 1 or 2 subdivisions, use flat shading
            s1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            s2: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            s3: new defs.Subdivision_Sphere(3),
            s4: new defs.Subdivision_Sphere(4)
        };

        // *** Materials
        this.materials = {
            skin: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("ffdbac")}),
            pants: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 0, color: hex_color("687796")}),
            shirt: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("ff0000")}),
            tree: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.6, color: hex_color("#4F7942")}),
            trunk: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.6, color: hex_color("#80461B")}),
            apple: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.6, color: hex_color("#FF0000")}),
            ground: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("7ec850")}),
            grass: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/animal-crossing-grass.png")
            }),
            sky: new Material(new defs.Phong_Shader(),
                {ambient: 1, specularity: .8, color: hex_color("#94DBF2")}),
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(),
                {ambient: .5, diffusivity: .6, color: hex_color("#992828")}),
            ring: new Material(new Ring_Shader(),
                {ambient: 1, color: hex_color("B08040")}),
            inactive_color: new Material(new defs.Phong_Shader(),
                {ambient: 1, specularity: .8, color: hex_color("#94DBF2")}),
            active_color: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, color: hex_color("#FF0000")}),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
            maxAmbRed: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, color: hex_color("#FF0000")}),
            planet1: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, color: hex_color("#808080"), specularity: 0}),
            planet2_gouraud: new Material(new Gouraud_Shader(),
                {ambient: 0, diffusivity: 0.1, color: hex_color("#80FFFF"), specularity: 1}),
            planet2_phong: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 0.1, color: hex_color("#80FFFF"), specularity: 1}),
            planet3: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, color: hex_color("B08040"), specularity: 1}),
            planet4: new Material(new defs.Phong_Shader(),
                {ambient: 0, smoothness: 1, color: hex_color("135EEB"), specularity: 0.9}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        // this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => this.initial_camera_location);
        // this.new_line();
        // this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        // this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        // this.new_line();
        // this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        // this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        // this.new_line();
        // this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.the_moon);
        this.key_triggered_button("Drop apple", ["0"], () => {this.apple_dropping = true; this.drop_time = animation_time / 1000.0;});
    }

    draw_little_fella(context, program_state) {
        var model_transform = Mat4.identity();

        let t = program_state.animation_time / 1000.0;
        let swayAngle = (0.1 * Math.PI);
        swayAngle = ((swayAngle/2) + ((swayAngle/2) * Math.sin(((2 * Math.PI) / 3) * t)));

        // how to stop movement after a certain time
        if (t >= 14) {
            swayAngle = 0;
        }

        // axes for reference
        //this.shapes.axes.draw(context, program_state, model_transform, this.materials.test);  // for reference
        
        // draw head
        var head_transform = model_transform.times(Mat4.scale(1.2, 1.05, 1)).times(Mat4.scale(-0.4, -0.4, -0.4)).times(Mat4.translation(0, -2, 0));
        // rotate little fella head
        if (t >= 5 && t < 6) {
            head_transform = head_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0));
        }
        else if (t >= 6 && t < 10) {
            head_transform = head_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0));
        }
        else if (t >= 10 && t < 14) {
            // if time was x coord and x-pos was y coord, we want to go from (10, 0) to (14, 3.1) --> slope is 0.775
            var x_transform = 0.7625 * t - (0.7625 * 10);
            // want to go from (10, 0) to (14, -6.4) --> slope is -1.6
            var z_transform = -1.6 * t - (-1.6 * 10);
            head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(x_transform, 0, z_transform));
        }
        else if (t >= 14) {
            head_transform = head_transform.times(Mat4.translation(0, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(0, -2, 0)).times(Mat4.translation(3.05, 0, -6.45));
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
        else if (t >= 10 && t < 14) {
            var x_transform = -1 * t - (-1 * 10);
            var z_transform = 1.75 * t - (1.75 * 10);
            // if (check_if_colliding) continue -- might have to "freeze time" somehow
            // else change the body transform
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(x_transform, 0, z_transform));
        }
        else if (t >= 14) {
            body_transform = body_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-4, 0, 7));
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
        else if (t >= 10 && t < 14) {
            var x_transform = -4 * t - (-4 * 10);
            var z_transform = 7 * t - (7 * 10);
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(x_transform, 0, z_transform)).times(Mat4.rotation(swayAngle, 1, 0, 0));
        }
        else if (t >= 14) {
            left_leg_transform = left_leg_transform.times(Mat4.translation(1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(-1.9, -2, 0)).times(Mat4.translation(-16, 0, 28));
        }

        var right_leg_tranform = model_transform.times(Mat4.scale(0.1, 0.3, 0.1)).times(Mat4.translation(1.9, -2, 0));
        if (t >= 5 && t < 6) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0));
        }
        else if (t >= 6 && t < 10) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0));
        }
        else if (t >= 10 && t < 14) {
            var x_transform = -4 * t - (-4 * 10);
            var z_transform = 7 * t - (7 * 10);
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(x_transform, 0, z_transform)).times(Mat4.rotation(-swayAngle, 1, 0, 0));
        }
        else if (t >= 14) {
            right_leg_tranform = right_leg_tranform.times(Mat4.translation(-1.9, 2, 0)).times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.translation(1.9, -2, 0)).times(Mat4.translation(-16, 0, 28));
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
        else if (t >= 10 && t < 14) {
            var x_transform = -0.8 * t - (-0.8 * 10);
            var z_transform = 7 * t - (7 * 10);
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(x_transform, 0, z_transform));
        }
        else if (t >= 14) {
            left_arm_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.5, 0.1, 0.1)).times(Mat4.translation(-0.7, 0.8, 0)).times(Mat4.translation(-3.3, 0, 28));
        }
        var right_arm_tranform = left_arm_transform.times(Mat4.translation(1.4, 0, 0));
        this.shapes.cube.draw(context, program_state, left_arm_transform, this.materials.skin);
        this.shapes.cube.draw(context, program_state, right_arm_tranform, this.materials.skin);

        // draw hands
        if (t < 5) {
            var left_hand_transform = model_transform.times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0));
        }
        else if (t >= 5 && t < 6) {
            left_hand_transform = model_transform.times(Mat4.rotation(t * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0));
        }
        else if (t >= 6 && t < 10) {
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0));
        }
        else if (t >= 10 && t < 14) {
            var x_transform = -2 * t - (-2 * 10);
            var z_transform = 3.5 * t - (3.5 * 10);
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0)).times(Mat4.translation(x_transform, 0, z_transform));
        }
        else if (t >= 14) {
            left_hand_transform = model_transform.times(Mat4.rotation(6 * 1.5, 0, 1, 0)).times(Mat4.scale(0.2, 0.2, 0.2)).times(Mat4.translation(-4.8, 0.4, 0)).times(Mat4.translation(-8, 0, 14));
        }
        var right_hand_transform = left_hand_transform.times(Mat4.translation(9.6, 0, 0));
        this.shapes.s4.draw(context, program_state, left_hand_transform, this.materials.skin);
        this.shapes.s4.draw(context, program_state, right_hand_transform, this.materials.skin);
    }

    draw_tree(context, program_state) {
        // this.shapes.palm_tree.draw(context, program_state, Mat4.identity(), this.materials.test);
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

    draw_ground(context, program_state) {
        var model_transform = Mat4.identity();
        let t = program_state.animation_time / 1000.0;
        var ground_transform = model_transform.times(Mat4.scale(10, .1, 10)).times(Mat4.translation(0, -9, 0));
        this.shapes.cube.draw(context, program_state, ground_transform, this.materials.grass);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        // if (!context.scratchpad.controls) {
        //     this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
        //     // Define the global camera and projection matrices, which are stored in program_state.
        //     program_state.set_camera(this.initial_camera_location);
        // }

        // program_state.projection_transform = Mat4.perspective(
        //     Math.PI / 4, context.width / context.height, .1, 1000);

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            //program_state.set_camera(Mat4.translation(5, -10, -30));
            program_state.set_camera(Mat4.translation(0, 0, -10))
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // lighting of sun
        const light_position = vec4(0, 0, 7, 1);  //light position at center of sun sphere
        // The parameters of the Light are: position, color, size
        // program_state.lights = [new Light(light_position, sun_color, 10**sun_rad)];

        //const light_position = vec4(0, 0, 5, 0);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        //var simulation = class Simulation {};
        // simulation.simulate();
        // if (program_state.animate)
        //     simulate(program_state.animation_delta_time);
        // Body.check_if_colliding()

        this.draw_little_fella(context, program_state);

        this.draw_tree(context, program_state);

        this.draw_ground(context, program_state);

        // // *** This draws the colliding outline around the tree trunk and little fella body ***
        var bodies = new Array();
        bodies.push(new Body(this.shapes.trunk, this.materials.trunk, vec3(1, 1 + Math.random())).emplace(this.trunk_location, 0, 0));
        bodies.push(new Body(this.shapes.cube, this.materials.shirt, vec3(1, 1 + Math.random())).emplace(this.little_fella_body_location, 0, 0));
        const {points, leeway} = this.colliders[this.collider_selection];
        const size = vec3(1 + leeway, 1 + leeway, 1 + leeway);
        for (let b of bodies) {
            // bodies[b] is a Body object
            points.draw(context, program_state, b.drawn_location.times(Mat4.scale(...size)), this.materials.skin, "LINE_STRIP");
        }

        // *** This implements collision detection ***
        const collider = this.colliders[this.collider_selection];
        // Loop through all bodies (call each "a"):
        for (let a of bodies) {
            // Cache the inverse of matrix of body "a" to save time.
            a.inverse = Mat4.inverse(a.drawn_location);

            // a.linear_velocity = a.linear_velocity.minus(a.center.times(dt));
            // Apply a small centripetal force to everything.
            a.material = this.materials.skin;
            // Default color: white

            // if (a.linear_velocity.norm() == 0)
            //     continue;

            // *** Collision process is here ***
            // Loop through all bodies again (call each "b"):
            for (let b of bodies) {
                // Pass the two bodies and the collision shape to check_if_colliding():
                if (!a.check_if_colliding(b, collider))
                    continue;
                // If we get here, we collided, so turn red and zero out the
                // velocity so they don't inter-penetrate any further.
                // console.log("Colliding");
                a.material = this.materials.shirt; // not seeing this happen
                // a.linear_velocity = vec3(0, 0, 0);
                // a.angular_velocity = 0;
            }
        }

        // add in a sky (sphere)
        var sky_transform = Mat4.identity();
        sky_transform = sky_transform.times(Mat4.scale(50, 50, 50))
        this.shapes.sphere.draw(context, program_state, sky_transform, this.materials.sky);
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

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

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            gl_Position = projection_camera_model_transform * vec4(position, 1.0);
            center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);  //just the center
            point_position = model_transform * vec4(position, 1.0);  //use position of where object is
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
            //had to play around with value multipled to distance to get about 7 rings
            float factor = sin(18.0 * distance(point_position.xyz, center.xyz));

            //the vector multipled in gl_FragColor determines the color
            //had to look up conversion of hex color "B08040" to RGB color
            gl_FragColor = factor * vec4(0.69, 0.50, 0.25, 1);  
        }`;
    }
}

